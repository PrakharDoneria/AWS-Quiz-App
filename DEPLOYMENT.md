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

## 3. Configure the IAM Role (Least Privilege)

### Important Note about `QuizAppLambdaRole`
AWS Amplify Hosting operates as a fully managed service. When you deploy a Next.js application, Amplify automatically provisions a hidden Lambda function for Server-Side Rendering (SSR) and generates a dedicated execution role for it. 
**You cannot directly assign your existing `QuizAppLambdaRole` to the Next.js SSR runtime in the Amplify Console.**

To use your existing role securely, you would have to write complex `sts:AssumeRole` code in Next.js to jump from the Amplify role to `QuizAppLambdaRole`. 
The officially supported and much simpler approach is to **find the auto-generated role created by Amplify and attach our least-privilege policy directly to it.**

Here are the exact AWS Console steps to do this:

### Step 3.1: Find the Amplify SSR Role
1. Log in to the **AWS Management Console**.
2. Go to the **IAM (Identity and Access Management)** service.
3. In the left navigation pane, click on **Roles**.
4. In the search box, search for your Amplify app's ID or type `AmplifySSRLoggingRole`.
5. You will see a role with a name similar to `amplify-<your-app-id>-<env>-AmplifySSRLoggingRole-<random>`. Click on this role name to open its details.

### Step 3.2: Remove Broad Permissions (If Any)
If you see any broad permissions like `AmazonDynamoDBFullAccess` attached to this role, remove them. 
1. Under the **Permissions** tab, look at the attached policies.
2. If you see full access policies, select the checkbox next to them and click **Remove**.

### Step 3.3: Attach the Least-Privilege Policy
We will now attach a policy that allows *only* the specific actions required for the `quiz-app` table.
1. Still on the Role's **Permissions** tab, click the **Add permissions** dropdown button.
2. Select **Create inline policy**.
3. In the Policy editor, select the **JSON** tab (or toggle "JSON" view).
4. Delete the empty template and paste the following exact JSON:

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
                "dynamodb:Query"
            ],
            "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/quiz-app"
        }
    ]
}
```

5. **CRITICAL:** Replace `REGION` with your region (e.g., `ap-south-1`) and `ACCOUNT_ID` with your 12-digit AWS account ID.
6. Click **Next** (or **Review policy**).
7. Give the policy a name, for example: `QuizAppDynamoDBLeastPrivilege`.
8. Click **Create policy**.

Your Next.js SSR runtime now has the exact permissions it needs to connect to DynamoDB without any hardcoded credentials!

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
