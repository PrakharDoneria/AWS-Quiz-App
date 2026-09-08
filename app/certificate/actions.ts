"use server";

import path from "path";
import Papa from "papaparse";
import sharp from "sharp";
import TextToSVG from "text-to-svg";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlmxQ3TYiTXHurhPK9HppSSnfXWlASyfMAJEtJS1XwRxHXamOMcSuHLvM8LHT3XAij3gTidYaYXM_q/pub?output=csv";

// Bounding box for the student name on the 3510×2478 certificate image
// Coordinates provided: (2150,1404), (3065,1401), (3062,1664), (2155,1656)
const NAME_BOX = {
  left: 2150,
  top: 1401,
  width: 915,   // 3065 - 2150
  height: 263,  // 1664 - 1401
};

let _textToSVG: any = null;
function getTextToSVG() {
  if (!_textToSVG) {
    const fontPath = path.join(process.cwd(), "public", "fonts", "CourierNew-Bold.ttf");
    _textToSVG = TextToSVG.loadSync(fontPath);
  }
  return _textToSVG;
}

/** Build an SVG snippet that centers the student name inside the bounding box */
function makeNameSvg(name: string): Buffer {
  // Auto-scale font size so even long names fit within the box width
  const maxFontSize = 90;
  const fitFontSize = Math.floor((NAME_BOX.width * 0.92) / (name.length * 0.58));
  const fontSize = Math.min(maxFontSize, Math.max(40, fitFontSize));

  const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // By converting text to SVG paths using text-to-svg, we completely bypass
  // librsvg's font loading. This guarantees 100% accurate text rendering
  // on AWS Lambda/Amplify without needing system fonts installed.
  const svgRenderer = getTextToSVG();
  const options = { fontSize, anchor: 'left top' };
  const metrics = svgRenderer.getMetrics(safeName, options);

  const x = (NAME_BOX.width - metrics.width) / 2;
  const y = (NAME_BOX.height - metrics.height) / 2;

  const pathD = svgRenderer.getD(safeName, { ...options, x, y });

  const svg = `<svg width="${NAME_BOX.width}" height="${NAME_BOX.height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathD}" fill="#1a1a2e" />
</svg>`;

  return Buffer.from(svg);
}

export async function generateCertificateAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString().trim();
    if (!email) throw new Error("Email is required");

    // 1. Fetch & parse CSV
    const csvRes = await fetch(CSV_URL, { cache: "no-store" });
    if (!csvRes.ok) throw new Error("Failed to fetch student data.");
    const csvText = await csvRes.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    const rows = parsed.data as any[];

    // 2. Find student by email (leader or teammate)
    let studentName: string | null = null;
    for (const row of rows) {
      const leaderEmail = row["Email Address"]?.toString().trim();
      const teammateEmail = row["Teammate's Email Address"]?.toString().trim();

      if (email.toLowerCase() === leaderEmail?.toLowerCase()) {
        studentName = row["Full Name"]?.toString().trim();
        break;
      } else if (email.toLowerCase() === teammateEmail?.toLowerCase()) {
        studentName = row["Teammate's Full Name"]?.toString().trim();
        break;
      }
    }

    if (!studentName) {
      throw new Error(
        "No registration found for this email. Make sure you use the email from your event registration form."
      );
    }

    // 3. Load certificate template and composite the name onto it
    const certPath = path.join(process.cwd(), "public", "certificate.jpg");
    const nameSvg = makeNameSvg(studentName);

    const outputBuffer = await sharp(certPath)
      .composite([
        {
          input: nameSvg,
          top: NAME_BOX.top,
          left: NAME_BOX.left,
        },
      ])
      .png()
      .toBuffer();

    // 4. Build a simple verify token
    const verifyToken = Buffer.from(`${studentName}:AWSQUIZ2026`)
      .toString("base64")
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 20);

    return {
      success: true,
      fileName: `${studentName}_AWS_Certificate.png`,
      mimeType: "image/png",
      base64: outputBuffer.toString("base64"),
      studentName,
      verifyToken,
    };
  } catch (error: any) {
    console.error("Certificate generation error:", error);
    return {
      success: false,
      error: error.message || "An error occurred during certificate generation.",
    };
  }
}
