export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const { prompt, context = "" } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A prompt is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured. Add GEMINI_API_KEY in Vercel Environment Variables." });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model,
          input: [
            prompt.trim(),
            typeof context === "string" && context.trim()
              ? "\nATTACHED PROJECT CONTEXT:\n" + context.slice(0, 18000)
              : ""
          ].join("\n"),
        system_instruction:
          "You are AstraFlow, a practical AI developer assistant. Help with frontend development, React, TypeScript, JavaScript, debugging, architecture and implementation planning. Be concise, actionable, honest and explain important tradeoffs. Prefer clear steps and code when useful."
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return res.status(504).json({ error: "The AI service timed out after 30 seconds. Please try again." });
      }
      console.error("AstraFlow provider request error:", error);
      return res.status(502).json({ error: "Could not reach the AI service. Please try again." });
    } finally {
      clearTimeout(timeoutId);
    }

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return res.status(502).json({ error: "The AI service returned an invalid response. Please try again." });
    }
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
        ?.trim() ||
      data?.output
        ?.filter((item) => item.type === "text")
        ?.map((item) => item.text || "")
        ?.join("")
        ?.trim();

    if (!text) {
      console.error("Gemini returned no text output:", JSON.stringify(data));
      return res.status(502).json({ error: "The AI returned no readable text. Please try again." });
    }

    return res.status(200).json({ text, model });
  } catch (error) {
    console.error("AstraFlow AI error:", error);
    return res.status(500).json({ error: "Could not reach the AI service." });
  }
}
