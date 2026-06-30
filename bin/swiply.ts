#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SwiplyBackendStack } from '../lib/swiply-stack';

const app = new cdk.App();
new SwiplyBackendStack(app, 'SwiplyBackendStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
});
