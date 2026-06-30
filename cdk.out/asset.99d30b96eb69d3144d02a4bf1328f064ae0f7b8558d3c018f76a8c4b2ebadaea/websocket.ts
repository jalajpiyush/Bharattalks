import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from '@aws-sdk/client-chime-sdk-meetings';
import { v4 as uuidv4 } from 'uuid';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const chimeClient = new ChimeSDKMeetingsClient({});

export const handler = async (event: any) => {
  const { routeKey, connectionId } = event.requestContext;
  
  if (routeKey === '$connect') {
    return { statusCode: 200 };
  }
  
  if (routeKey === '$disconnect') {
    // Attempt to remove user from queue and mark offline
    try {
      const getRes = await docClient.send(new ScanCommand({
        TableName: process.env.USERS_TABLE,
        FilterExpression: "connectionId = :cid",
        ExpressionAttributeValues: { ":cid": connectionId }
      }));
      
      if (getRes.Items && getRes.Items.length > 0) {
        const userId = getRes.Items[0].userId;
        await docClient.send(new DeleteCommand({ TableName: process.env.QUEUE_TABLE, Key: { userId } }));
        await docClient.send(new PutCommand({
          TableName: process.env.USERS_TABLE,
          Item: { ...getRes.Items[0], connectionId: null, online: false, searching: false }
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return { statusCode: 200 };
  }

  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const apigwManagementApi = new ApiGatewayManagementApiClient({ endpoint });
  
  try {
    const body = JSON.parse(event.body);
    
    if (body.type === 'register') {
      const userId = body.userId;
      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: { userId, connectionId, online: true, searching: false }
      }));
    }
    
    if (body.type === 'matchmaking_join') {
      const userId = body.userId;
      await docClient.send(new PutCommand({
        TableName: process.env.QUEUE_TABLE,
        Item: { userId, joinedAt: Date.now(), userData: body.userData }
      }));
      
      // Basic Matchmaking Logic
      const queue = await docClient.send(new ScanCommand({ TableName: process.env.QUEUE_TABLE }));
      const others = (queue.Items || []).filter(item => item.userId !== userId);
      
      if (others.length > 0) {
        const partner = others[0];
        const roomId = `${userId}_${partner.userId}`;
        
        // Amazon Chime integration
        const meetingResponse = await chimeClient.send(new CreateMeetingCommand({
          ClientRequestToken: uuidv4(),
          MediaRegion: 'us-east-1',
          ExternalMeetingId: roomId
        }));
        
        const attendee1 = await chimeClient.send(new CreateAttendeeCommand({
          MeetingId: meetingResponse.Meeting?.MeetingId,
          ExternalUserId: userId
        }));
        
        const attendee2 = await chimeClient.send(new CreateAttendeeCommand({
          MeetingId: meetingResponse.Meeting?.MeetingId,
          ExternalUserId: partner.userId
        }));

        await docClient.send(new DeleteCommand({ TableName: process.env.QUEUE_TABLE, Key: { userId } }));
        await docClient.send(new DeleteCommand({ TableName: process.env.QUEUE_TABLE, Key: { userId: partner.userId } }));
        
        // Notify both via WebSockets
        await apigwManagementApi.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ type: 'matched', roomId, role: 'offerer', partner: partner.userData, meeting: meetingResponse.Meeting, attendee: attendee1.Attendee })
        }));
        
        // Get partner connectionId
        const partnerData = await docClient.send(new GetCommand({ TableName: process.env.USERS_TABLE, Key: { userId: partner.userId } }));
        if (partnerData.Item?.connectionId) {
          await apigwManagementApi.send(new PostToConnectionCommand({
            ConnectionId: partnerData.Item.connectionId,
            Data: JSON.stringify({ type: 'matched', roomId, role: 'answerer', partner: body.userData, meeting: meetingResponse.Meeting, attendee: attendee2.Attendee })
          }));
        }
      }
    }
    
    if (body.type === 'signal' || body.type === 'chat_message') {
      const partnerData = await docClient.send(new GetCommand({ TableName: process.env.USERS_TABLE, Key: { userId: body.receiverId } }));
      if (partnerData.Item?.connectionId) {
        await apigwManagementApi.send(new PostToConnectionCommand({
          ConnectionId: partnerData.Item.connectionId,
          Data: JSON.stringify({ type: body.type, senderId: body.senderId, signal: body.signal, message: body.message })
        }));
      }
    }
    
    return { statusCode: 200 };
  } catch (e) {
    console.error(e);
    return { statusCode: 500 };
  }
};
