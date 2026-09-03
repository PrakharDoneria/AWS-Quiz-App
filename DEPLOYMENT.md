# AWS Quiz App Deployment Guide

This guide explains how to deploy the AWS Quiz App to **AWS Amplify Hosting** and set up the **least-privilege IAM policy** for Next.js Server-Side Rendering (SSR) to access DynamoDB securely without hardcoded credentials.

## 1. Create the DynamoDB Table

1. Go to the **Amazon DynamoDB** console in your preferred region (e.g., `ap-south-1`).
2. Click **Create table**.
3. **Table details**:
   - Table name: `quiz-app` (Or match your `DYNAMODB_TABLE_NAME` env variable)
   - Partition key: `PK` (String)
   - Sort key: `SK` (String)
4. Leave other settings as default (On-demand capacity is recommended for cost savings).
5. Click **Create table**.

## 2. Deploy to AWS Amplify

1. Push your code to a GitHub repository.
2. Go to the **AWS Amplify Console**.
3. Choose **Host web app** and connect your GitHub repository.
4. Select the repository and branch.
5. In the **Build settings** step, amplify will auto-detect Next.js.
6. Under **Advanced settings**, add your Environment Variables:
   - `REGION` = `ap-south-1` (or your chosen region)
   - `DYNAMODB_TABLE_NAME` = `quiz-app`
7. Click **Save and deploy**.

> [!NOTE]
> During the first build, the app will deploy successfully, but database operations will fail because the Amplify SSR role doesn't have permission to access DynamoDB yet. We will fix this in the next step.

## 3. Configure IAM Access

AWS Amplify Hosting for Next.js does not automatically inject execution role credentials to the Next.js Server Actions. To securely access DynamoDB, you must create a dedicated IAM User with least-privilege permissions and provide its Access Keys to Amplify via Environment Variables.

### Step 3.1: Create an IAM User
1. Log in to the **AWS Management Console**.
2. Go to the **IAM** service and click **Users** -> **Create user**.
3. Name the user (e.g., `quiz-app-dynamo-user`) and click **Next**.
4. Choose **Attach policies directly**.
5. We will create a least-privilege policy. Click **Create policy** (opens in a new tab).
6. In the Policy editor, select the **JSON** tab and paste the following exact JSON:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/quiz-app"
        }
    ]
}
```
*CRITICAL:* Replace `REGION` with your region (e.g., `ap-south-1`) and `ACCOUNT_ID` with your 12-digit AWS account ID.

7. Click **Next**, name the policy `QuizAppDynamoDBLeastPrivilege`, and click **Create policy**.
8. Go back to the user creation tab, refresh the policies list, select `QuizAppDynamoDBLeastPrivilege`, and finish creating the user.

### Step 3.2: Generate Access Keys
1. Click on your newly created user.
2. Go to the **Security credentials** tab.
3. Scroll down to **Access keys** and click **Create access key**.
4. Choose **Application running outside AWS** and click **Next**.
5. Copy the **Access key ID** and **Secret access key**. (Keep these safe!)

### Step 3.3: Add Credentials to Amplify
1. Go back to your App in the **AWS Amplify Console**.
2. Navigate to **Hosting** -> **Environment variables**.
3. Add two new variables:
   - `ACCESS_KEY_ID`: (paste your access key ID)
   - `SECRET_ACCESS_KEY`: (paste your secret access key)
4. Trigger a new build/deployment in Amplify for the environment variables to take effect.

## 4. Local Development

To run this application locally, **do not put AWS credentials in `.env`**.

1. Install the AWS CLI and configure it by running:
   ```bash
   aws configure
   ```
   Or use AWS IAM Identity Center (SSO).
2. The AWS SDK v3 automatically picks up your local `~/.aws/credentials`.
3. Create a `.env.local` file:
   ```env
   REGION=ap-south-1
   DYNAMODB_TABLE_NAME=quiz-app
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 5. Verification Checklist

- [ ] Verify you can create a new quiz session from the home page.
- [ ] Verify a second player can join using the 6-digit Join Code.
- [ ] Verify both players can answer questions.
- [ ] Verify the results page calculates individual scores and the combined team average score correctly.
