import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SwiplyBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Amazon Cognito Setup
    const userPool = new cognito.UserPool(this, 'SwiplyUserPool', {
      userPoolName: 'swiply-pool',
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
    });

    // Google Identity Provider
    const googleIdp = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIdP', {
      userPool,
      clientId: process.env.GOOGLE_CLIENT_ID || 'client-id',
      clientSecretValue: cdk.SecretValue.unsafePlainText(process.env.GOOGLE_CLIENT_SECRET || 'client-secret'),
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
      scopes: ['profile', 'email', 'openid'],
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'SwiplyAppClient', {
      userPool,
      generateSecret: false,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      oAuth: {
        callbackUrls: [process.env.APP_URL || 'https://localhost:3000/'], 
        logoutUrls: [process.env.APP_URL || 'https://localhost:3000/'],
      },
    });

    userPoolClient.node.addDependency(googleIdp);

    userPool.addDomain('SwiplyCognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'swiply-auth-' + this.account,
      },
    });

    // 2. DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'swiply_users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const queueTable = new dynamodb.Table(this, 'QueueTable', {
      tableName: 'swiply_queue',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const roomsTable = new dynamodb.Table(this, 'RoomsTable', {
      tableName: 'swiply_rooms',
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 3. Lambda Functions for Matchmaking and WebSockets
    const websocketHandler = new lambda.Function(this, 'WebSocketHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'websocket.handler',
      environment: {
        USERS_TABLE: usersTable.tableName,
        QUEUE_TABLE: queueTable.tableName,
        ROOMS_TABLE: roomsTable.tableName,
      },
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(websocketHandler);
    queueTable.grantReadWriteData(websocketHandler);
    roomsTable.grantReadWriteData(websocketHandler);

    // Grant Amazon Chime permissions to Lambda
    websocketHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'chime:CreateMeeting',
        'chime:DeleteMeeting',
        'chime:CreateAttendee',
        'chime:DeleteAttendee',
        'chime:GetMeeting',
        'chime:GetAttendee',
      ],
      resources: ['*'],
    }));

    // 4. API Gateway WebSocket
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'SwiplyWebSocketApi');
    
    webSocketApi.addRoute('$connect', {
      integration: new WebSocketLambdaIntegration('ConnectIntegration', websocketHandler),
    });
    webSocketApi.addRoute('$disconnect', {
      integration: new WebSocketLambdaIntegration('DisconnectIntegration', websocketHandler),
    });
    webSocketApi.addRoute('$default', {
      integration: new WebSocketLambdaIntegration('DefaultIntegration', websocketHandler),
    });

    new apigatewayv2.WebSocketStage(this, 'ProductionStage', {
      webSocketApi,
      stageName: 'production',
      autoDeploy: true,
    });
  }
}
