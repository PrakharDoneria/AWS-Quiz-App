"use server";

import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlmxQ3TYiTXHurhPK9HppSSnfXWlASyfMAJEtJS1XwRxHXamOMcSuHLvM8LHT3XAij3gTidYaYXM_q/pub?output=csv";

function generateToken(name: string) {
  return Buffer.from(`${name}:AWSQUIZ2026`)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 20);
}

export type CertificateDetails = {
  name: string;
  role: string;
  college: string;
  teamName: string;
};

export async function verifyCertificateAction(token: string) {
  if (!token) return { valid: false };
  token = token.toUpperCase().trim();

  try {
    const csvRes = await fetch(CSV_URL, { cache: "no-store" });
    if (!csvRes.ok) throw new Error("Failed to fetch data.");
    const csvText = await csvRes.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    const rows = parsed.data as any[];

    for (const row of rows) {
      // Leader
      const leaderName = row["Full Name"]?.toString().trim();
      if (leaderName && generateToken(leaderName) === token) {
        return {
          valid: true,
          details: {
            name: leaderName,
            role: "Team Leader",
            college: row["College / Institute Name"]?.toString().trim() || "IEC College of Engineering & Technology",
            teamName: row["Quiz Team Name"]?.toString().trim() || "N/A",
          }
        };
      }

      // Teammate
      const teammateName = row["Teammate's Full Name"]?.toString().trim();
      if (teammateName && generateToken(teammateName) === token) {
        return {
          valid: true,
          details: {
            name: teammateName,
            role: "Teammate",
            college: row["College / Institute Name"]?.toString().trim() || "IEC College of Engineering & Technology",
            teamName: row["Quiz Team Name"]?.toString().trim() || "N/A",
          }
        };
      }
    }

    return { valid: false };
  } catch (error) {
    console.error("Verification error:", error);
    return { valid: false };
  }
}
