# 🌌 Aurora — Beyond the Interface Chatbot

[Aurora Chatbot Preview](https://aurora-beyond-the-interface.vercel.app/)

**Aurora** is an AI-powered chatbot interface built on top of **Google’s Gemini AI**. It offers a modern, responsive chat experience with features like chat history, file context integration, speech input, and elegant markdown rendering — all wrapped in a beautifully designed UI.

---

## ✨ Features

- 🔮 **Gemini AI Integration** – Powered by Google’s Generative Language API
- 💬 **Intuitive Chat Interface** – Clean, modern UI with smooth animations
- 🌓 **Dark/Light Mode** – User-selectable theme with persistent preferences
- 🗂️ **Chat History** – Save, load, and manage conversation sessions
- 📎 **File Context** – Upload PDFs and images for contextual analysis
- 🎙️ **Speech Recognition** – Voice input with real-time transcription
- 📝 **Markdown Support** – Syntax-highlighted code with copy buttons
- 📱 **Responsive Design** – Fully optimized for desktop and mobile
- 💡 **Suggested Prompts** – Quickly get started with pre-defined questions

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Arnab27622/Aurora---Beyond-the-Interface.git
cd Aurora---Beyond-the-Interface
```


## 2. Install dependencies

```bash
npm install
```

## 3. Set up environment variables

```bash
# Create .env.local in root directory
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

MONGODB_URI=your-mongodb-connection-string

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL_ID=your-gemini-model-id
```

**Note:** These variables are private (no `NEXT_PUBLIC_` prefix) and are only accessible on the server-side. Your API keys are never exposed to the client.

## 4. Run the development server

```bash
cd Aurora---Beyond-the-Interface
npm run dev
```

