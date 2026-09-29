export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const { prompt, context = "" } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A task is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured. Add GEMINI_API_KEY in Vercel Environment Variables." });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: [
          "TASK:",
          prompt.trim(),
          typeof context === "string" && context.trim()
            ? "\nATTACHED PROJECT CONTEXT:\n" + context.slice(0, 18000)
            : ""
        ].join("\n"),
        system_instruction:
          "You are AstraFlow Agent, a practical software-engineering agent. Work in three explicit stages: PLAN, IMPLEMENTATION, VERIFICATION. First identify the root problem and exact steps. Then provide concrete code or file-level changes the developer can apply. Finally verify the approach with tests, edge cases, and a rollback note. Never claim you changed a real file or ran a real test unless the system actually gave you that tool. Be concise, technical, and actionable."
      }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return res.status(502).json({ error: "The AI service returned an invalid response. Please try again." });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "The AI provider returned an error."
      });
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

    if (!text) {
      console.error("Gemini agent returned no text output:", JSON.stringify(data));
      return res.status(502).json({ error: "The agent returned no readable result. Please try again." });
    }

    return res.status(200).json({ text, model, mode: "agent" });
  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({ error: "The AI service timed out after 30 seconds. Please try again." });
    }
    console.error("AstraFlow Agent error:", error);
    return res.status(502).json({ error: "Could not reach the AI service. Please try again." });
  } finally {
    clearTimeout(timeoutId);
  }
}
