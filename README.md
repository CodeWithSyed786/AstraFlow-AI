# ✦ AstraFlow AI

> **Think clearly. Build faster.**

AstraFlow AI is a focused, modern developer workspace concept built with React, TypeScript and Vite. It is designed around a simple idea: coding tools should help developers move from **problem → reasoning → action** without adding unnecessary noise.

### What it does

- 🧠 Turns coding questions into structured implementation thinking
- 🐛 Provides a dedicated space for debugging and technical explanations
- ⚡ Keeps common developer actions inside one lightweight workspace
- 🧩 Uses a component-first React architecture
- 📱 Responsive UI for desktop and smaller screens
- 🔐 Prepared for future AI/API integration without hard-coding secrets

### Current MVP

The first version focuses on the **frontend product experience**:

- Workspace navigation
- AI prompt composer
- Quick-start developer prompts
- Interactive response state
- Copy response interaction
- Responsive dark developer interface
- Lightweight animated visual identity

The AI response layer is now connected to a secure local Express API. The API keeps the Gemini key on the server instead of exposing it in the React bundle.

### Tech Stack

- React
- TypeScript
- Vite
- CSS
- GitHub Actions

### Run locally

```bash
npm install

# Terminal 1 — start the AI API
npm run server

# Terminal 2 — start the frontend
npm run dev
```

Before running the AI locally, copy `.env.example` to `.env` and add your Gemini API key. Never commit `.env`.

Create a production build:

```bash
npm run build
```

### Product direction

AstraFlow is intended to evolve toward an AI-assisted developer environment with features such as:

1. Code explanation and debugging
2. Project-aware context
3. Refactoring suggestions
4. Implementation planning
5. Git/GitHub workflow assistance
6. Safe AI API integration
7. Developer productivity analytics

### Why this project?

This project is part of my journey as a **Frontend Developer and AI-Assisted Builder**. The goal is not to make another generic chatbot UI, but to explore how AI can become part of a practical developer workflow.

Built by **Syed Eman — CodeWithSyed786**.

[GitHub Profile](https://github.com/CodeWithSyed786) · [Portfolio](https://code-with-syed-573ac.web.app/)