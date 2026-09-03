import { createDemoQuiz, joinSession } from "./actions";
import { BrainCircuit, Play, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8 text-center">
      <BrainCircuit size={64} className="mb-6" style={{ color: "var(--primary)" }} />
      <h1>AWS Quiz Master</h1>
      <p>Test your knowledge or challenge your friends in real-time.</p>

      <div className="grid grid-cols-2 gap-4 mt-8 w-full">
        <div className="glass-panel flex flex-col items-center gap-4">
          <Users size={32} />
          <h3>Join a Quiz</h3>
          <form action={joinSession} className="flex flex-col gap-4 w-full">
            <input 
              name="joinCode" 
              type="text" 
              placeholder="6-Digit Join Code" 
              className="input" 
              required 
              maxLength={6}
              minLength={6}
            />
            <input 
              name="name" 
              type="text" 
              placeholder="Your Name" 
              className="input" 
              required 
              maxLength={20}
            />
            <button type="submit" className="btn w-full">Join Session</button>
          </form>
        </div>

        <div className="glass-panel flex flex-col items-center justify-center gap-4">
          <Play size={32} />
          <h3>Start New Quiz</h3>
          <p className="mb-4">Create a new AWS Cloud Practitioner demo quiz session.</p>
          <form action={createDemoQuiz} className="w-full">
            <button type="submit" className="btn w-full">Create Quiz Session</button>
          </form>
        </div>
      </div>
    </main>
  );
}
