import { useMemo, useState } from "react";

const suggestions = [
  "Explain why this React component is re-rendering",
  "Generate a clean API service pattern for TypeScript",
  "Turn these requirements into a frontend implementation plan"
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [active, setActive] = useState("Workspace");
  const [copied, setCopied] = useState(false);

  const response = useMemo(() => {
    if (!prompt.trim()) return null;
    return {
      title: "AstraFlow analysis",
      body: "I would break this into three steps: understand the requirement, isolate the smallest implementation, then verify it with a focused test. Keep the UI and business logic separated so the code stays easy to change."
    };
  }, [prompt]);

  async function copyResponse() {
    if (!response) return;
    await navigator.clipboard?.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>AstraFlow</span></div>
        <button className="new-chat" onClick={() => setPrompt("")}>＋ New workspace</button>
        <nav>
          {["Workspace","Projects","Snippets","History"].map(item =>
            <button key={item} className={active === item ? "nav-item active" : "nav-item"} onClick={() => setActive(item)}>
              <span>{item === "Workspace" ? "⌘" : item === "Projects" ? "▦" : item === "Snippets" ? "◇" : "◷"}</span>{item}
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="status-dot"><i/> Local workspace ready</div>
          <div className="profile"><div className="avatar">SE</div><div><strong>CodeWithSyed</strong><small>Frontend Developer</small></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">AI DEVELOPER WORKSPACE</span><h1>{active}</h1></div>
          <div className="top-actions"><button>⌘ K</button><button className="icon-btn">⋯</button></div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="pill">✦ Built for focused development</div>
            <h2>Think clearly.<br/><em>Build faster.</em></h2>
            <p>AstraFlow turns messy coding tasks into a calm workspace for planning, debugging, explaining and shipping frontend ideas.</p>
          </div>
          <div className="orb-wrap"><div className="orb"><div className="orb-core">✦</div></div></div>
        </section>

        <section className="workspace-card">
          <div className="card-head"><div><span className="mini-label">ASK ASTRA</span><h3>What are you building?</h3></div><span className="shortcut">Ctrl ↵</span></div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe a bug, feature, idea, or coding problem..." />
          <div className="composer-foot">
            <div className="tools"><button>＋ Attach</button><button>⌁ Context</button><button>⌘ Model</button></div>
            <button className="send" onClick={() => setPrompt(prompt.trim())}>Run analysis <span>↗</span></button>
          </div>
        </section>

        {!response ? (
          <section className="suggestions">
            <div className="section-title"><span>QUICK START</span><small>Try something real</small></div>
            <div className="suggestion-grid">
              {suggestions.map((s,i) => <button key={s} onClick={() => setPrompt(s)}><span>0{i+1}</span>{s}<b>↗</b></button>)}
            </div>
          </section>
        ) : (
          <section className="response-card">
            <div className="response-head"><div><span className="mini-label">ASTRAFLOW</span><h3>{response.title}</h3></div><button onClick={copyResponse}>{copied ? "Copied" : "Copy"}</button></div>
            <p>{response.body}</p>
            <div className="response-tags"><span>Reasoning</span><span>Frontend</span><span>Actionable</span></div>
          </section>
        )}

        <footer><span>AstraFlow AI</span><span>React · TypeScript · Vite</span><span>Built by CodeWithSyed786</span></footer>
      </main>
    </div>
  );
}

export default App;