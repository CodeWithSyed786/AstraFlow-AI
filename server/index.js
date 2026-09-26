import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

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
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        model,
        input: prompt.trim(),
        system_instruction:
          "You are AstraFlow, a practical AI developer assistant. Help with frontend development, React, TypeScript, JavaScript, debugging, architecture and implementation planning. Be concise, actionable and honest."
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "The AI provider returned an error." });
    }

    const text =
      data?.output_text?.trim() ||
      data?.steps
        ?.filter((step) => step.type === "model_output")
        ?.flatMap((step) => step.content || [])
        ?.filter((item) => item.type === "text")
        ?.map((item) => item.text || "")
        ?.join("")
        ?.trim();

    if (!text) return res.status(502).json({ error: "The AI returned no readable text. Please try again." });

    res.json({ text, model });
  } catch (error) {
    console.error("AstraFlow AI error:", error);
    res.status(500).json({ error: "Could not reach the AI service." });
  }
});


app.post("/api/agent", async (req, res) => {
  const { prompt, context = "", mode = "agent" } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A task is required." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI is not configured. Add GEMINI_API_KEY to your local .env file." });
  }

  const task = prompt.trim();
  const contextText = typeof context === "string" ? context.slice(0, 18000) : "";

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        model,
        input: [
          "TASK:",
          task,
          contextText ? "\nATTACHED PROJECT CONTEXT:\n" + contextText : "",
          "\nOPERATING MODE: " + mode
        ].join("\n"),
        system_instruction:
          "You are AstraFlow Agent, a practical software-engineering agent. Work in three explicit stages: PLAN, IMPLEMENTATION, VERIFICATION. First identify the root problem and exact steps. Then provide concrete code or file-level changes the developer can apply. Finally verify the approach with tests, edge cases, and a rollback note. Never claim you changed a real file or ran a real test unless the system actually gave you that tool. Be concise, technical, and actionable."
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "The AI provider returned an error." });
    }

    const text =
      data?.output_text?.trim() ||
      data?.steps
        ?.filter((step) => step.type === "model_output")
        ?.flatMap((step) => step.content || [])
        ?.filter((item) => item.type === "text")
        ?.map((item) => item.text || "")
        ?.join("")
        ?.trim();

    if (!text) return res.status(502).json({ error: "The agent returned no readable result. Please try again." });
    res.json({ text, model, mode: "agent" });
  } catch (error) {
    console.error("AstraFlow Agent error:", error);
    res.status(500).json({ error: "Could not reach the AI service." });
  }
});

app.listen(port, () => console.log(`AstraFlow API running on http://localhost:${port}`));
