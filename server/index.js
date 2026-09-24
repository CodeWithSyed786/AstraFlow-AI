import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY), model });
});

app.post("/api/chat", async (req, res) => {
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A prompt is required." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI is not configured. Add GEMINI_API_KEY to your local .env file." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are AstraFlow, a practical AI developer assistant. Help with frontend development, React, TypeScript, JavaScript, debugging, architecture and implementation planning. Be concise, actionable and honest." }]
          },
          contents: [{ role: "user", parts: [{ text: prompt.trim() }] }]
        })
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "The AI provider returned an error." });

    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!text) return res.status(502).json({ error: "The AI returned an empty response." });

    res.json({ text });
  } catch (error) {
    console.error("AstraFlow AI error:", error);
    res.status(500).json({ error: "Could not reach the AI service." });
  }
});

app.listen(port, () => console.log(`AstraFlow API running on http://localhost:${port}`));
