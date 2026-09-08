"use client";

import { useState } from "react";
import { generateCertificateAction } from "./actions";

export default function CertificatePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certData, setCertData] = useState<any>(null);

  async function handleGenerate(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result: any = await generateCertificateAction(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setCertData(result);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container flex flex-col items-center justify-center gap-8 mt-12 mb-16 text-center max-w-4xl mx-auto px-4">
      <div className="flex justify-center items-center gap-4 mb-4">
        <h1 className="mb-0 text-5xl tracking-tight text-white shadow-none" style={{ textShadow: '4px 4px 0px var(--primary)' }}>My Certificate</h1>
      </div>
      <p className="mb-8 text-lg text-gray-300">
        Enter your registered Email Address to generate your AWS Quiz certificate.
      </p>

      {error && (
        <div className="bg-red-500/10 border-2 border-danger text-danger p-4 rounded-md w-full shadow-[4px_4px_0px_0px_var(--danger)] mb-2">
          <p className="font-bold text-lg">Error</p>
          <p className="text-sm break-words">{error}</p>
        </div>
      )}

      {certData ? (
        <div className="w-full bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="text-2xl font-black text-white">Certificate for {certData.studentName}</h2>
          </div>

          {/* Certificate Preview */}
          <div className="w-full rounded-lg border-2 border-[#445167] overflow-hidden bg-white">
            <img
              src={`data:${certData.mimeType};base64,${certData.base64}`}
              alt="Your AWS Quiz Certificate"
              className="w-full h-auto block"
            />
          </div>

          {/* Verify token bar */}
          <div className="w-full bg-[#0d1117] border border-[#324054] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Certificate ID / Verify Token</p>
              <p className="font-mono text-green-400 font-bold tracking-widest">{certData.verifyToken}</p>
            </div>
            <a
              href={`/verify-certificate?token=${certData.verifyToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-[#1a202c] border border-[#445167] text-gray-300 hover:text-white hover:border-tertiary text-sm font-bold uppercase tracking-wider py-2 px-4 rounded transition-all"
            >
              🔗 Verify Certificate
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <a
              href={`data:${certData.mimeType};base64,${certData.base64}`}
              download={certData.fileName}
              className="flex-1 bg-primary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all flex justify-center items-center gap-2"
            >
              ⬇ Download Image
            </a>
            <button
              onClick={() => { setCertData(null); setError(null); }}
              className="flex-1 bg-[#1a202c] border-2 border-[#445167] text-gray-300 hover:text-white font-black text-xl uppercase tracking-wider py-4 px-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transition-all"
            >
              Generate Another
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-[#10141a] border-4 border-[#324054] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)] rounded-xl p-8 md:p-10 flex flex-col">
          <form action={handleGenerate} className="flex flex-col gap-6 w-full text-left">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your registered email"
                className="w-full bg-[#0d1117] border-2 border-[#445167] p-4 text-white text-xl focus:border-primary focus:shadow-[4px_4px_0px_0px_var(--primary)] outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Use the same email you registered with on the event form.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-primary text-white font-black text-xl uppercase tracking-wider py-4 px-6 border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] transition-all w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating...
                </span>
              ) : "Generate Certificate"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
