# AWS Quiz Master

A real-time, interactive quiz application built with Next.js and AWS DynamoDB. Test your AWS Cloud knowledge or challenge your friends in live quiz sessions!

## 🚀 Features

- **Real-time Quiz Sessions:** Create a quiz lobby and share a 6-digit join code with participants.
- **AWS Cloud Practitioner Content:** Comes with a built-in demo quiz focusing on AWS services.
- **Serverless Backend:** Fully powered by Next.js Server Actions and Amazon DynamoDB.
- **Modern UI:** Built with Tailwind CSS and Lucide React icons for a clean, responsive, and engaging user experience.
- **AWS Amplify Ready:** Easily deployable to AWS Amplify Hosting.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database:** [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)
- **Deployment:** [AWS Amplify](https://aws.amazon.com/amplify/)

## 📋 Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- An AWS Account
- AWS CLI configured locally with appropriate permissions (if running locally against real AWS resources)

## ⚙️ Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PrakharDoneria/AWS-Quiz-App.git
   cd AWS-Quiz-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory (you can copy `.env.example` if it exists):
   ```env
   REGION=ap-south-1
   DYNAMODB_TABLE_NAME=quiz-app
   ```

4. **Set up DynamoDB:**
   - Go to your AWS Console -> DynamoDB.
   - Create a new table named `quiz-app` (or your chosen name in `.env.local`).
   - Set the Partition Key to `PK` (String).
   - Set the Sort Key to `SK` (String).

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ☁️ Deployment on AWS Amplify

1. Push your code to a GitHub repository.
2. Go to the AWS Amplify Console and choose **Host web app**.
3. Connect your GitHub repository and select the branch.
4. In the **Environment variables** section of Amplify, add:
   - `REGION`
   - `DYNAMODB_TABLE_NAME`
5. **Crucial Step (IAM Permissions):**
   - By default, the Amplify SSR Execution Role does not have permissions to access DynamoDB.
   - Go to **App Settings > General > Service Role** (or the SSR Web Compute role) in the IAM console.
   - Attach an inline policy granting `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan`, and `dynamodb:UpdateItem` actions for your DynamoDB table ARN.
6. Deploy your application!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
