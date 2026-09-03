import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Do not provide explicit credentials here.
// In local development, the AWS SDK will use ~/.aws/credentials (e.g. from AWS CLI).
// In production on AWS Amplify, it will automatically use the IAM role attached to the SSR function.
const client = new DynamoDBClient({
  region: process.env.REGION || "ap-south-1",
  ...((process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) && 
      (process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
    ? {
        credentials: {
          accessKeyId: (process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID)!,
          secretAccessKey: (process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)!,
        },
      }
    : {}),
});

const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export { ddbDocClient };
export const TableName = process.env.DYNAMODB_TABLE_NAME || "quiz-app";
