# ✦ AstraFlow AI

> **Think clearly. Build brilliantly.**

AstraFlow AI is a focused AI developer workspace for turning coding problems into practical next steps. It combines a premium frontend workspace with a server-side Gemini integration for debugging, explanations, implementation planning and developer productivity.

## ✨ What AstraFlow does

- 🤖 Ask Gemini developer-focused questions
- 🐛 Debug React, JavaScript and TypeScript problems
- 🧠 Turn feature ideas into implementation plans
- 📎 Attach text/code files locally for review
- 💾 Keep recent conversations in browser history
- 📋 Copy AI answers and reusable snippets
- 📱 Responsive premium workspace UI
- 🔐 Keep the Gemini API key server-side

## 🚀 Live

**Web app:** https://astra-flow-ai.vercel.app/

## 🛠️ Stack

- React 19
- TypeScript
- Vite
- CSS
- Express for local API development
- Google Gemini API
- Vercel deployment
- GitHub Actions

## 🔐 Environment variables

Create a local `.env` from `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=8787
```

Never commit `.env`. For Vercel, add `GEMINI_API_KEY` and optionally `GEMINI_MODEL` under Project Settings → Environment Variables.

## 💻 Run locally

```bash
npm install
```

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev
```

Open the Vite URL shown in your terminal.

## 🧩 Product direction

AstraFlow is intentionally being built as a practical developer workspace rather than a generic chatbot. Planned areas include project-aware context, codebase analysis, refactoring assistance, Git/GitHub workflows, safe AI tooling and productivity analytics.

## 👨‍💻 Builder

**Syed Eman — Frontend Developer • React Developer • AI-Assisted Builder**

GitHub: https://github.com/CodeWithSyed786  
Portfolio: https://code-with-syed-573ac.web.app/

## 📄 License

MIT
