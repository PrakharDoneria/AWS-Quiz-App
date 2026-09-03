import { getSessionByJoinCode, getParticipants, updateSessionStatus } from "@/lib/quiz/db";
import { redirect } from "next/navigation";
import LobbyClient from "./LobbyClient";

export default async function LobbyPage({
  params,
  searchParams,
}: {
  params: Promise<{ joinCode: string }>;
  searchParams: Promise<{ participantId?: string }>;
}) {
  const { joinCode } = await params;
  const { participantId } = await searchParams;

  const session = await getSessionByJoinCode(joinCode);
  if (!session) {
    return <div className="container mt-8"><h2>Session not found</h2></div>;
  }

  const participants = await getParticipants(session.id);

  async function startQuiz() {
    "use server";
    await updateSessionStatus(session!.id, "ACTIVE", new Date().toISOString());
    redirect(`/session/${joinCode}/play${participantId ? `?participantId=${participantId}` : ''}`);
  }

  // If already active, auto redirect to play
  if (session.status === "ACTIVE") {
    redirect(`/session/${joinCode}/play${participantId ? `?participantId=${participantId}` : ''}`);
  }

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <LobbyClient 
        session={session} 
        participants={participants} 
        participantId={participantId || ""} 
        startQuizAction={startQuiz} 
      />
    </main>
  );
}
