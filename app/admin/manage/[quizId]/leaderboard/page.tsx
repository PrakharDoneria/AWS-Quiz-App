import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getQuiz } from "@/lib/quiz/db";

import { ddbDocClient, TableName } from "@/lib/aws/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_auth")?.value !== "true") {
    redirect("/admin");
  }

  const { quizId } = await params;
  const quiz = await getQuiz(quizId);
  if (!quiz) return <div>Quiz not found</div>;

  const sessionResponse = await ddbDocClient.send(new ScanCommand({
    TableName,
    FilterExpression: "SK = :sk AND begins_with(PK, :pk) AND quizId = :qid AND #st = :st",
    ExpressionAttributeNames: { "#st": "status" },
    ExpressionAttributeValues: {
      ":sk": "METADATA",
      ":pk": "SESSION#",
      ":qid": quizId,
      ":st": "COMPLETED"
    }
  }));

  const sessions = sessionResponse.Items || [];
  
  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <Trophy size={32} className="text-yellow-400" />
          <h2 className="mb-0">Leaderboard: {quiz.title}</h2>
        </div>

        <div className="glass-panel p-6 text-center text-gray-400">
          <p>Leaderboard aggregation requires a Global Secondary Index on Sessions or saving the final team score directly to the session metadata.</p>
          <p className="mt-2 text-sm">Found {sessions.length} completed sessions for this quiz.</p>
        </div>

        <div className="mt-8 flex items-center mb-8 border-t border-white/10 pt-4">
          <Link href="/admin/manage" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Manage
          </Link>
        </div>
      </div>
    </main>
  );
}
