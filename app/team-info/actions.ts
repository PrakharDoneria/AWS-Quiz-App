"use server";

import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlmxQ3TYiTXHurhPK9HppSSnfXWlASyfMAJEtJS1XwRxHXamOMcSuHLvM8LHT3XAij3gTidYaYXM_q/pub?output=csv";

export type TeamInfo = {
  teamName: string;
  college: string;
  leader: {
    name: string;
    email: string;
    roll: string;
    branch: string;
    whatsapp: string;
  };
  teammate: {
    name: string;
    email: string;
    roll: string;
    whatsapp: string;
  } | null;
};

export async function getTeamInfoAction(formData: FormData) {
  try {
    const query = formData.get("query")?.toString().trim().toLowerCase();
    if (!query) throw new Error("Search query (email or roll number) is required.");

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
      const email = row["Email Address"]?.toString().trim().toLowerCase();
      const teammateEmail = row["Teammate's Email Address"]?.toString().trim().toLowerCase();
      const roll = row["Roll Number"]?.toString().trim().toLowerCase();
      const teammateRoll = row["Teammate's Roll Number / Enrollment Number"]?.toString().trim().toLowerCase();
      
      if (email === query || teammateEmail === query || roll === query || teammateRoll === query) {
        // Found the team
        const hasTeammate = !!row["Teammate's Email Address"]?.toString().trim();
        
        const teamInfo: TeamInfo = {
          teamName: row["Quiz Team Name"]?.toString().trim() || "N/A",
          college: row["College / Institute Name"]?.toString().trim() || "N/A",
          leader: {
            name: row["Full Name"]?.toString().trim() || "N/A",
            email: row["Email Address"]?.toString().trim() || "N/A",
            roll: row["Roll Number"]?.toString().trim() || "N/A",
            branch: row["Branch / Department"]?.toString().trim() || "N/A",
            whatsapp: row["Mobile / WhatsApp Number"]?.toString().trim() || "N/A",
          },
          teammate: hasTeammate ? {
            name: row["Teammate's Full Name"]?.toString().trim() || "N/A",
            email: row["Teammate's Email Address"]?.toString().trim() || "N/A",
            roll: row["Teammate's Roll Number / Enrollment Number"]?.toString().trim() || "N/A",
            whatsapp: row["Teammate's Mobile / WhatsApp Number"]?.toString().trim() || "N/A",
          } : null
        };
        
        return { success: true, data: teamInfo };
      }
    }

    return { success: false, error: "Team not found. Make sure you entered a registered email or roll number." };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || "An error occurred." };
  }
}
