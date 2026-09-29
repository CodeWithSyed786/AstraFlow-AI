const AGENTS = [
  { id: "researcher", name: "Research Agent", role: "Research technology, documentation, APIs, alternatives, constraints and evidence.", focus: "research" },
  { id: "developer", name: "Developer Agent", role: "Design implementation architecture, React/TypeScript/backend changes, debugging and code strategy.", focus: "development" },
  { id: "designer", name: "UI/UX Designer Agent", role: "Define user flows, information architecture, responsive UI, accessibility and interaction states.", focus: "uiux" },
  { id: "strategist", name: "Strategy Agent", role: "Turn findings into milestones, priorities, risks, resources and an execution roadmap.", focus: "strategy" },
  { id: "content", name: "Content Agent", role: "Create product copy, documentation, UX copy, launch messaging and clear explanations when needed.", focus: "content" },
  { id: "security", name: "Security Agent", role: "Review secrets, authentication, validation, injection risks, permissions, APIs and data handling.", focus: "security" },
  { id: "qa", name: "QA Agent", role: "Challenge the plan, find edge cases, regressions, missing requirements and verification steps.", focus: "qa" }
];

const PROVIDERS = {
  gemini: {
    key: "GEMINI_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/interactions"
  },
  groq: {
    key: "GROQ_API_KEY",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    endpoint: "https://api.groq.com/openai/v1/chat/completions"
  },
  openrouter: {
    key: "OPENROUTER_API_KEY",
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
    endpoint: "https://openrouter.ai/api/v1/chat/completions"
  },
  nvidia: {
    key: "NVIDIA_API_KEY",
    model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions"
  }
};

function providerStatus() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    configured: Boolean(process.env[p.key]),
    model: p.model
  }));
}

function extractGemini(data) {
  return data?.output_text?.trim() ||
    data?.steps?.filter(s => s.type === "model_output")
      ?.flatMap(s => s.content || [])
      ?.filter(x => x.type === "text")
      ?.map(x => x.text || "").join("").trim() || "";
}

function extractOpenAI(data) {
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

async function callProvider(providerId, system, input) {
  const p = PROVIDERS[providerId];
  if (!p || !process.env[p.key]) throw new Error(providerId + " is not configured.");

  if (providerId === "gemini") {
    const response = await fetch(p.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env[p.key] },
      body: JSON.stringify({ model: p.model, input, system_instruction: system })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Gemini request failed.");
    const text = extractGemini(data);
    if (!text) throw new Error("Gemini returned no readable text.");
    return { text, provider: providerId, model: p.model };
  }

  const response = await fetch(p.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env[p.key],
      ...(providerId === "openrouter" ? { "HTTP-Referer": "https://astra-flow-ai.vercel.app", "X-Title": "AstraFlow AI" } : {})
    },
    body: JSON.stringify({
      model: p.model,
      temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: input }]
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || providerId + " request failed.");
  const text = extractOpenAI(data);
  if (!text) throw new Error(providerId + " returned no readable text.");
  return { text, provider: providerId, model: p.model };
}

async function generate(system, input, preferred = ["gemini", "groq", "openrouter", "nvidia"]) {
  const attempts = [];
  for (const id of preferred) {
    if (!PROVIDERS[id] || !process.env[PROVIDERS[id].key]) continue;
    try {
      const result = await callProvider(id, system, input);
      return { ...result, attempts };
    } catch (error) {
      attempts.push({ provider: id, error: error.message });
    }
  }
  throw new Error("No configured AI provider succeeded.");
}

function parseJson(text, fallback) {
  try {
    const cleaned = text.replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

export async function runAgentTeam({ prompt, context = "" }) {
  const objective = prompt.trim();
  const safeContext = typeof context === "string" ? context.slice(0, 18000) : "";

  const manager = await generate(
    "You are the AstraFlow Manager Agent. You are the only agent-facing manager. Understand the user's objective, detect material ambiguity, and create a professional execution plan. Return ONLY valid JSON with keys: needsClarification (boolean), clarificationQuestions (string[]), objective (string), tasks (array of objects with agentId, title, task, priority), successCriteria (string[]). Do not invent tool access.",
    "USER OBJECTIVE:\n" + objective + (safeContext ? "\n\nPROJECT CONTEXT:\n" + safeContext : ""),
    ["gemini", "openrouter", "groq", "nvidia"]
  );
  const plan = parseJson(manager.text, {
    needsClarification: false,
    clarificationQuestions: [],
    objective,
    tasks: AGENTS.map(a => ({ agentId: a.id, title: a.name, task: objective, priority: "medium" })),
    successCriteria: ["Clear actionable result", "Requirements covered", "Risks identified"]
  });

  if (plan.needsClarification && plan.clarificationQuestions?.length) {
    return {
      mode: "manager",
      status: "needs_clarification",
      providers: providerStatus(),
      plan,
      agents: []
    };
  }

  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  const selected = tasks.length ? tasks : AGENTS.map(a => ({ agentId: a.id, title: a.name, task: objective, priority: "medium" }));
  const selectedAgents = selected.map(t => AGENTS.find(a => a.id === t.agentId)).filter(Boolean);

  const results = await Promise.all(selectedAgents.map(async (agent) => {
    const task = selected.find(t => t.agentId === agent.id);
    try {
      const result = await generate(
        "You are the " + agent.name + ". Role: " + agent.role + " You are a specialist inside AstraFlow. Work only on your assigned task. Be precise, practical and honest. Do not claim to have changed files, browsed, tested code, or used tools unless you actually have them. Return concise findings, recommendations, risks and concrete deliverables.",
        "GLOBAL OBJECTIVE:\n" + objective + "\n\nASSIGNED TASK:\n" + task.task + (safeContext ? "\n\nPROJECT CONTEXT:\n" + safeContext : ""),
        agent.id === "researcher" ? ["gemini", "openrouter", "groq", "nvidia"] : ["groq", "gemini", "openrouter", "nvidia"]
      );
      return { id: agent.id, name: agent.name, status: "completed", provider: result.provider, model: result.model, result: result.text };
    } catch (error) {
      return { id: agent.id, name: agent.name, status: "failed", result: error.message };
    }
  }));

  const synthesisInput = JSON.stringify({ objective, plan, agentResults: results });
  const final = await generate(
    "You are the AstraFlow Manager Agent completing a team run. Synthesize specialist findings into a professional answer. Return ONLY valid JSON with keys: summary (string), execution (array of strings), decisions (array of strings), issues (array of strings), strategy (array of strings), nextSteps (array of strings), qaStatus (string). Never claim work was actually executed if agents only proposed it.",
    synthesisInput,
    ["gemini", "openrouter", "groq", "nvidia"]
  );
  const finalResult = parseJson(final.text, {
    summary: final.text,
    execution: results.map(r => r.name + ": " + r.status),
    decisions: [],
    issues: results.filter(r => r.status === "failed").map(r => r.name + ": " + r.result),
    strategy: [],
    nextSteps: [],
    qaStatus: "REVIEW_REQUIRED"
  });

  return {
    mode: "manager",
    status: "completed",
    managerProvider: manager.provider,
    providers: providerStatus(),
    plan,
    agents: results,
    final: finalResult
  };
}

export { AGENTS, providerStatus };
