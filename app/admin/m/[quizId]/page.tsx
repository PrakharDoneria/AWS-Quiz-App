import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getQuiz, getQuestions, getParticipants } from "@/lib/quiz/db";
import { ddbDocClient, TableName } from "@/lib/aws/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import Link from "next/link";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { Session } from "@/types/session";
import { SessionDraggableList } from "../SessionDraggableList";

export default async function SecretQuizManagePage({
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

  const questions = await getQuestions(quizId);

  // Fetch all sessions for this quiz
  const sessionResponse = await ddbDocClient.send(new ScanCommand({
    TableName,
    FilterExpression: "SK = :sk AND begins_with(PK, :pk) AND quizId = :qid",
    ExpressionAttributeValues: {
      ":sk": "METADATA",
      ":pk": "SESSION#",
      ":qid": quizId,
    }
  }));

  const sessions = (sessionResponse.Items || []) as Session[];
  
  const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
    const participants = await getParticipants(session.id);
    const teamScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
    return { session, participants, teamScore };
  }));
  
  // Sort descending by teamScore
  sessionsWithStats.sort((a, b) => b.teamScore - a.teamScore);

  return (
    <main className="container flex flex-col gap-8 mt-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link href="/admin/m" className="text-gray-400 hover:text-white mr-4">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="mb-0 text-white flex items-center gap-2">
            Managing: {quiz.title}
          </h2>
          <span className="text-red-500 text-sm font-bold uppercase tracking-wider">Secret Admin Route</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Sessions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xl flex items-center gap-2 border-b border-white/5 pb-2">
            <Users size={20} className="text-primary" /> Quiz Sessions
          </h3>
          <SessionDraggableList initialSessions={sessionsWithStats} quizId={quizId} />
        </div>

        {/* Right Col: Questions Overview */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl flex items-center gap-2 border-b border-white/5 pb-2">
            <BookOpen size={20} className="text-primary" /> Questions ({questions.length})
          </h3>
          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-[#1a202c] border border-[#2d3748] rounded p-3 text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-300">Q{idx + 1}.</span>
                  <span className="text-xs text-primary">{q.points} pts</span>
                </div>
                <p className="mb-3 text-gray-200">{q.text}</p>
                <div className="flex flex-col gap-1">
                  {q.options.map(opt => (
                    <div key={opt.id} className={`text-xs p-1.5 rounded border ${opt.id === q.correctOptionId ? 'bg-green-900/30 border-green-700/50 text-green-300' : 'bg-black/20 border-white/5 text-gray-500'}`}>
                      {opt.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
