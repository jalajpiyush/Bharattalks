# AWS IAM Permissions for SWIPLY Deployment

The IAM user `SWIPLY` requires the following permissions to successfully bootstrap and deploy the AWS CDK application. 

You can attach the following inline policy to the user in the AWS IAM Console. It includes the permissions explicitly requested (`cloudformation:CreateChangeSet`, `ssm:GetParameter`, `iam:PassRole`, `s3:*`, `lambda:*`, `dynamodb:*`, and `cognito-idp:*`) along with other necessary actions (like creating IAM roles) that CDK requires to provision resources.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CDKDeploymentPermissions",
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "ssm:GetParameter",
                "ssm:PutParameter",
                "iam:PassRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:GetRole",
                "s3:*",
                "lambda:*",
                "dynamodb:*",
                "cognito-idp:*",
                "apigateway:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### Steps to Apply:
1. Go to the [AWS IAM Console](https://console.aws.amazon.com/iam/).
2. Navigate to **Users** and select the `SWIPLY` user.
3. Under the **Permissions** tab, click **Add permissions** -> **Create inline policy** (or attach directly).
4. Switch to the **JSON** tab and paste the policy above.
5. Review and save the policy with a name like `SwiplyCDKDeployPolicy`.

Once the policy is attached, you can retry your deployment commands:
```bash
npx cdk bootstrap
npx cdk deploy
```
