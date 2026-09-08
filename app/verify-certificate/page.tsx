"use client";

import { useEffect, useState, useTransition } from "react";
import { verifyCertificateAction, type CertificateDetails } from "./actions";

export default function VerifyCertificatePage() {
  const [tokenInput, setTokenInput] = useState("");
  const [result, setResult] = useState<{ details?: CertificateDetails; valid: boolean } | null>(null);
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Pre-fill token from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setTokenInput(t);
      verify(t);
    }
  }, []);

  function verify(token: string) {
    startTransition(async () => {
      const res = await verifyCertificateAction(token);
      setResult(res);
      setChecked(true);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    verify(tokenInput);
  }

  return (
    <main className="container flex flex-col items-center justify-center gap-8 mt-12 mb-16 text-center max-w-xl mx-auto px-4">
      <div className="flex justify-center items-center gap-4 mb-4">
        <h1 className="mb-0 text-5xl tracking-tight text-white shadow-none" style={{ textShadow: '4px 4px 0px var(--tertiary)' }}>
          Verify Certificate
        </h1>
      </div>
      <p className="mb-4 text-lg text-gray-300">
        Enter the Certificate ID to verify the authenticity of an AWS Quiz certificate.
      </p>

      {isPending && <p className="text-tertiary font-bold animate-pulse">Verifying...</p>}

      {!isPending && checked && result && (
        <div className={`w-full p-6 rounded-xl border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] flex flex-col items-center gap-4 ${
          result.valid
            ? "bg-green-500/10 border-green-500 text-green-400"
            : "bg-red-500/10 border-red-500 text-red-400"
        }`}>
          <div className="text-5xl">{result.valid ? "✅" : "❌"}</div>
          <p className="font-black text-2xl uppercase tracking-wider">
            {result.valid ? "Authentic Certificate" : "Invalid Certificate"}
          </p>
          
          {result.valid && result.details ? (
            <div className="bg-[#0d1117] border-2 border-green-500/50 p-4 rounded-lg w-full text-left flex flex-col gap-2 mt-2">
              <p><span className="text-gray-400 uppercase text-xs font-bold mr-2">Issued To:</span> <span className="text-white font-mono">{result.details.name}</span></p>
              <p><span className="text-gray-400 uppercase text-xs font-bold mr-2">College:</span> <span className="text-white font-mono">{result.details.college}</span></p>
              <p><span className="text-gray-400 uppercase text-xs font-bold mr-2">Team:</span> <span className="text-white font-mono">{result.details.teamName}</span></p>
              <p><span className="text-gray-400 uppercase text-xs font-bold mr-2">Role:</span> <span className="text-white font-mono">{result.details.role}</span></p>
              <p><span className="text-gray-400 uppercase text-xs font-bold mr-2">Event:</span> <span className="text-white font-mono">AWS Cloud & DSA Coding Challenge 2026</span></p>
              <p><span className="text-gray-400 uppercase text-xs font-bold mr-2">Issuer:</span> <span className="text-white font-mono">AWS Student Builder Group</span></p>
            </div>
          ) : (
            <p className="text-sm opacity-80">
              This certificate ID could not be verified in our records. It may be invalid or tampered.
            </p>
          )}
        </div>
      )}

      <div className="w-full bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl p-8 md:p-10 flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full text-left">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Certificate ID</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value.toUpperCase()); setChecked(false); }}
              placeholder="Paste Certificate ID here"
              className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl font-mono tracking-widest uppercase focus:border-tertiary focus:shadow-[4px_4px_0px_0px_var(--tertiary)] outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 bg-tertiary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>

      <a href="/certificate" className="text-gray-500 hover:text-white underline text-sm transition-colors">
        ← Get my Certificate
      </a>
    </main>
  );
}
