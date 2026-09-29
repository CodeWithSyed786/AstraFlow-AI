import { useEffect, useRef, useState } from "react";

type HistoryItem = {
  id: number;
  prompt: string;
  answer: string;
  createdAt: string;
};

const suggestions = [
  "Debug this React rendering issue and explain the root cause",
  "Design a clean TypeScript API service for a React app",
  "Turn my feature idea into a step-by-step frontend plan",
];

const projects = [
  { name: "AstraFlow AI", type: "AI developer workspace", status: "Live", icon: "✦" },
  { name: "Eman AI", type: "Islamic AI assistant", status: "Live", icon: "☾" },
  { name: "Syed Eman Portfolio", type: "React portfolio", status: "Live", icon: "◈" },
  { name: "Dr. Kinza Saleem", type: "Professional website", status: "Live", icon: "＋" },
];

const snippets = [
  { title: "React component", code: "export function Component() {\n  return <section />;\n}" },
  { title: "Fetch service", code: "const response = await fetch('/api/...');\nconst data = await response.json();" },
  { title: "TypeScript type", code: "type ApiResult<T> = {\n  data: T;\n  error?: string;\n};" },
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState("Workspace");
  const [answer, setAnswer] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedPrompt, setFailedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [contextMode, setContextMode] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [agentRun, setAgentRun] = useState<any>(null);
  const [attachedFile, setAttachedFile] = useState("");
  const [attachedContext, setAttachedContext] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("astraflow-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // Ignore invalid local history.
    }
  }, []);

  function saveHistory(item: HistoryItem) {
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    localStorage.setItem("astraflow-history", JSON.stringify(next));
  }

  function startNewWorkspace() {
    setPrompt("");
    setAnswer("");
    setSubmittedPrompt("");
    setError("");
    setFailedPrompt("");
    setAttachedFile("");
    setAttachedContext("");
    setAgentRun(null);
    setActive("Workspace");
  }

  async function runAnalysis(requestPrompt = prompt) {
    const cleanPrompt = requestPrompt.trim();
    if (!cleanPrompt || loading) return;

    setLoading(true);
    setError("");
    setFailedPrompt("");
    setAnswer("");
    setSubmittedPrompt(cleanPrompt);

    try {
      const res = await fetch(agentMode ? "/api/agent" : "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          mode: agentMode ? "agent" : "chat",
          context: contextMode ? attachedContext : "",
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "AI request failed.");

      let text = data.text?.trim() || "";
      if (agentMode) {
        setAgentRun(data);
        if (data.status === "needs_clarification") {
          text = "Manager needs clarification:\n\n" + (data.plan?.clarificationQuestions || []).map((q: string, i: number) => (i + 1) + ". " + q).join("\n");
        } else {
          const f = data.final || {};
          text = [
            f.summary,
            f.execution?.length ? "EXECUTION\n" + f.execution.map((x: string) => "• " + x).join("\n") : "",
            f.decisions?.length ? "DECISIONS\n" + f.decisions.map((x: string) => "• " + x).join("\n") : "",
            f.issues?.length ? "ISSUES\n" + f.issues.map((x: string) => "• " + x).join("\n") : "",
            f.strategy?.length ? "STRATEGY\n" + f.strategy.map((x: string) => "• " + x).join("\n") : "",
            f.nextSteps?.length ? "NEXT STEPS\n" + f.nextSteps.map((x: string) => "• " + x).join("\n") : "",
            f.qaStatus ? "QA STATUS: " + f.qaStatus : ""
          ].filter(Boolean).join("\n\n");
        }
      }
      if (!text) throw new Error("The AI returned an empty response.");

      setAnswer(text);
      saveHistory({
        id: Date.now(),
        prompt: cleanPrompt,
        answer: text,
        createdAt: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed.");
      setFailedPrompt(cleanPrompt);
    } finally {
      setLoading(false);
    }
  }

  async function copyResponse(text = answer) {
    if (!text) return;
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  function handleSuggestion(value: string) {
    setActive("Workspace");
    setPrompt(value);
    setTimeout(() => document.getElementById("prompt-box")?.focus(), 0);
  }

  async function handleFile(file?: File) {
    if (!file) return;
    const allowed = /\.(txt|md|js|jsx|ts|tsx|json|css|html)$/i.test(file.name);
    if (!allowed) {
      setError("Attach a text/code file: TXT, MD, JS, JSX, TS, TSX, JSON, CSS or HTML.");
      return;
    }

    const text = await file.text();
    const clipped = text.slice(0, 12000);
    setAttachedFile(file.name);
    setAttachedContext(clipped);
    setPrompt((current) => current || `Review the attached project context and suggest useful improvements.`);
  }

  const navItems = [
    { label: "Workspace", icon: "⌘" },
    { label: "Projects", icon: "▦" },
    { label: "Snippets", icon: "◇" },
    { label: "History", icon: "◷" },
    { label: "Agent Team", icon: "✦" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>AstraFlow</span>
          <small>AI</small>
        </div>

        <button className="new-chat" onClick={startNewWorkspace}>
          <span>＋</span> New workspace
        </button>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={active === item.label ? "nav-item active" : "nav-item"}
              onClick={() => setActive(item.label)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot">
            <i /> AI workspace online
          </div>
          <div className="profile">
            <div className="avatar">SE</div>
            <div>
              <strong>CodeWithSyed</strong>
              <small>Frontend Developer</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">ASTRAFLOW / AI DEVELOPER WORKSPACE</span>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <span className="live-badge"><i /> Gemini connected</span>
            <button>⌘ K</button>
          </div>
        </header>

        {active === "Workspace" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="pill">✦ AI-assisted development, without the clutter</div>
                <h2>Think clearly.<br /><em>Build brilliantly.</em></h2>
                <p>
                  A focused AI workspace for debugging, planning, explaining code and turning
                  frontend ideas into practical next steps.
                </p>
                <div className="hero-stats">
                  <span><b>01</b> Ask</span>
                  <span><b>02</b> Reason</span>
                  <span><b>03</b> Build</span>
                </div>
              </div>
              <div className="orb-wrap" aria-hidden="true">
                <div className="orb-ring ring-one" />
                <div className="orb-ring ring-two" />
                <div className="orb"><div className="orb-core">✦</div></div>
              </div>
            </section>

            <section className="workspace-card">
              <div className="card-head">
                <div>
                  <span className="mini-label">ASK ASTRA</span>
                  <h3>What are you building?</h3>
                </div>
                <span className="shortcut">Ctrl ↵</span>
              </div>

              <textarea
                id="prompt-box"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runAnalysis();
                }}
                placeholder="Describe a bug, feature, idea, or coding problem..."
              />

              <div className="composer-foot">
                <div className="tools">
                  <button onClick={() => fileRef.current?.click()}>＋ Attach</button>
                  <button className={contextMode ? "tool-active" : ""} onClick={() => setContextMode(!contextMode)}>
                    ⌁ Context {contextMode ? "On" : "Off"}
                  </button>
                  <button className={agentMode ? "tool-active" : ""} onClick={() => setAgentMode(!agentMode)}>
                    ✦ Manager {agentMode ? "On" : "Off"}
                  </button>
                  <button onClick={() => setError("AstraFlow currently uses Gemini 3.8 Flash for fast developer responses.")}>◉ Gemini 3.8 Flash</button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html"
                    hidden
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
                <button className="send" onClick={() => runAnalysis()} disabled={loading || !prompt.trim()}>
                  {loading ? "Thinking..." : "Run analysis"} <span>↗</span>
                </button>
              </div>
              {attachedFile && <div className="attachment">Attached locally: <b>{attachedFile}</b></div>}
              {contextMode && <div className="context-note">Project context mode is enabled{attachedFile ? ` — ${attachedFile} is included with this request.` : " — attach a code/text file to give Astra real project context."}</div>}
              {agentMode && <div className="agent-note">Manager Mode: Manager → Specialist Team → Manager verification. You only talk to the Manager.</div>}
            </section>

            {submittedPrompt && answer && (
              <section className="response-card">
                <div className="response-head">
                  <div>
                    <span className="mini-label">ASTRAFLOW RESPONSE</span>
                    <h3>{submittedPrompt.slice(0, 80)}{submittedPrompt.length > 80 ? "…" : ""}</h3>
                  </div>
                  <button onClick={() => copyResponse()}>{copied ? "Copied ✓" : "Copy"}</button>
                </div>
                <div className="answer">{answer}</div>
                <div className="response-tags"><span>Gemini</span><span>{agentMode ? "Agent Mode" : "Frontend"}</span><span>{agentMode ? "Plan → Fix → Verify" : "Actionable"}</span></div>
              </section>
            )}

            {agentRun?.agents?.length > 0 && (
              <section className="agent-activity">
                <div className="section-title"><span>TEAM ACTIVITY</span><small>Manager orchestration</small></div>
                <div className="agent-grid">
                  {agentRun.agents.map((agent: any) => (
                    <article className="agent-card" key={agent.id}>
                      <div className="agent-card-top"><span className="agent-avatar">✦</span><span className={agent.status === "completed" ? "agent-status done" : "agent-status"}>{agent.status}</span></div>
                      <strong>{agent.name}</strong>
                      <small>{agent.provider ? agent.provider + " · " + agent.model : agent.result}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {!submittedPrompt && (
              <section className="suggestions">
                <div className="section-title"><span>QUICK START</span><small>Try something real</small></div>
                <div className="suggestion-grid">
                  {suggestions.map((s, i) => (
                    <button key={s} onClick={() => handleSuggestion(s)}>
                      <span>0{i + 1}</span>{s}<b>↗</b>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {error && (
              <div className="error-card" role="alert">
                <span>⚠ {error}</span>
                {failedPrompt && (
                  <button className="retry-button" onClick={() => runAnalysis(failedPrompt)} disabled={loading}>
                    Retry
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {active === "Projects" && (
          <section className="panel-page">
            <div className="page-intro"><span className="mini-label">YOUR BUILD LAB</span><h2>Projects</h2><p>Your current experiments and shipped frontend work.</p></div>
            <div className="project-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.name}>
                  <div className="project-icon">{project.icon}</div>
                  <div><span className="project-status">{project.status}</span><h3>{project.name}</h3><p>{project.type}</p></div>
                  <button onClick={() => handleSuggestion(`Help me improve the frontend architecture and UI of ${project.name}.`)}>Ask Astra ↗</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {active === "Snippets" && (
          <section className="panel-page">
            <div className="page-intro"><span className="mini-label">DEVELOPER TOOLKIT</span><h2>Snippets</h2><p>Small patterns ready to copy into your next build.</p></div>
            <div className="snippet-grid">
              {snippets.map((snippet) => (
                <article className="snippet-card" key={snippet.title}>
                  <div className="snippet-head"><h3>{snippet.title}</h3><button onClick={() => copyResponse(snippet.code)}>Copy</button></div>
                  <pre>{snippet.code}</pre>
                </article>
              ))}
            </div>
          </section>
        )}

        {active === "Agent Team" && (
          <section className="panel-page">
            <div className="page-intro"><span className="mini-label">ASTRAFLOW ORCHESTRATION</span><h2>Agent Team</h2><p>One Manager coordinates specialist agents and returns a verified strategy.</p></div>
            <div className="agent-grid team-page">
              {[
                ["Manager Agent","Owns the objective, clarification, planning, delegation and final synthesis."],
                ["Research Agent","Technology, docs, APIs, alternatives and constraints."],
                ["Developer Agent","React, TypeScript, backend, architecture and implementation strategy."],
                ["UI/UX Designer Agent","Flows, responsive UI, accessibility and interaction states."],
                ["Strategy Agent","Priorities, milestones, risks, resources and roadmap."],
                ["Content Agent","README, product copy, UX copy and launch content."],
                ["Security Agent","Secrets, auth, validation, injection and data safety."],
                ["QA Agent","Requirements, edge cases, regressions and verification."]
              ].map(([name,desc]) => (
                <article className="agent-card" key={name}><div className="agent-card-top"><span className="agent-avatar">✦</span><span className="agent-status done">READY</span></div><strong>{name}</strong><small>{desc}</small></article>
              ))}
            </div>
          </section>
        )}

        {active === "History" && (
          <section className="panel-page">
            <div className="page-intro"><span className="mini-label">LOCAL MEMORY</span><h2>History</h2><p>Your recent AstraFlow conversations stay in this browser.</p></div>
            {history.length ? (
              <div className="history-list">
                {history.map((item) => (
                  <button className="history-item" key={item.id} onClick={() => { setPrompt(item.prompt); setSubmittedPrompt(item.prompt); setAnswer(item.answer); setActive("Workspace"); }}>
                    <span>{item.createdAt}</span><strong>{item.prompt}</strong><small>{item.answer.slice(0, 120)}…</small>
                  </button>
                ))}
              </div>
            ) : <div className="empty-state">No conversations yet. Ask Astra something from the Workspace.</div>}
          </section>
        )}

        <footer><span>AstraFlow AI</span><span>React · TypeScript · Vite · Gemini</span><span>Built by CodeWithSyed786</span></footer>
      </main>
    </div>
  );
}

export default App;