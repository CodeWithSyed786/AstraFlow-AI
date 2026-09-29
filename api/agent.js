import { runAgentTeam } from "../server/agent-team.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const { prompt, context = "" } = req.body ?? {};
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A task is required." });
  }
  try {
    const result = await runAgentTeam({ prompt, context });
    if (result.status === "needs_clarification") return res.status(200).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("AstraFlow Manager error:", error);
    return res.status(503).json({ error: error.message || "The manager could not complete the team run." });
  }
}
