export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A prompt is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured. Add GEMINI_API_KEY in Vercel Environment Variables." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are AstraFlow, a practical AI developer assistant. Help with frontend development, React, TypeScript, JavaScript, debugging, architecture and implementation planning. Be concise, actionable, honest and explain important tradeoffs. Prefer clear steps and code when useful."
            }]
          },
          contents: [{ role: "user", parts: [{ text: prompt.trim() }] }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "The AI provider returned an error."
      });
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({ error: "The AI returned an empty response." });
    }

    return res.status(200).json({ text, model });
  } catch (error) {
    console.error("AstraFlow AI error:", error);
    return res.status(500).json({ error: "Could not reach the AI service." });
  }
}
