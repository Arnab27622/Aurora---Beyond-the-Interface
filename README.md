 # 🌌 Aurora — Beyond the Interface Chat Assistant

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blue)](https://deepmind.google/technologies/gemini/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Aurora** is a cutting-edge AI chatbot interface built on Next.js 15, powered by Google's **Gemini AI**. It goes beyond simple text interaction by offering a rich, multi-modal experience — supporting document analysis, image understanding, capabilities, and voice interactions, all wrapped in a secure and beautiful UI.

[**Live Demo**](https://aurora-beyond-the-interface.vercel.app/)

---

## ✨ Key Features

### 🤖 Advanced AI Intelligence
- **Powered by Gemini**: Leverages Google's state-of-the-art Generative Language API for deep understanding and creative responses.
- **Contextual Awareness**: Maintains chat history to understand the flow of conversation.

### 📂 Multi-Modal File Support
Aurora isn't just for text. Upload files to give the AI context. We support extensive file parsing:
- **Documents**: 
  - 📄 **PDF** (`.pdf`) - Intelligent text extraction.
  - 📝 **Word** (`.docx`, `.doc`) - via `mammoth`.
  - 📊 **Excel** (`.xlsx`, `.xls`) - via `xlsx` (reads multiple sheets).
  - 🎞️ **PowerPoint** (`.pptx`, `.ppt`) - via `pptx-parser` (extracts slide text).
  - 📜 **Text/CSV** (`.txt`, `.csv`).
- **Images**: 
  - 🖼️ **Visual Analysis** - direct image understanding (`.jpg`, `.png`, `.gif`, `.webp`, `.bmp`).

### 🎙️ Natural Interaction
- **Speech Recognition**: Speak naturally to Aurora using integrated voice input.
- **Markdown Rendering**: Beautifully formatted responses with syntax highlighting for code blocks.
- **Responsive Design**: Flawless experience across desktop and mobile devices.

### 🛡️ Security & Privacy
- **Robust Authentication**: Secure user accounts via **NextAuth.js**.
- **Data Persistence**: Conversation history saved securely in **MongoDB**.
- **Safety First**:
  - **CSRF Protection**: Native Cross-Site Request Forgery defense.
  - **Rate Limiting**: Protects against API abuse.
  - **Input Sanitization**: Prevents XSS attacks.
  - **Secure File Validation**: Magic byte verification to ensure file integrity.

### 🎨 Modern UI/UX
- **Theming**: Persistent Dark/Light mode preferences.
- **Animations**: Smooth transitions and micro-interactions.
- **Accessibility**: Built with Radix UI primitives.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: NextAuth.js v4
- **Styling**: Tailwind CSS, PostCSS, Lucide React Icons
- **AI Provider**: Google Generative AI SDK
- **File Processing**: `pdfjs-dist`, `mammoth`, `xlsx`, `pptx-parser`
- **Validation**: Zod & zxcvbn

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js 18+ installed.
- A MongoDB database (local or Atlas).
- A Google Cloud Project with Gemini API access.

### 1. Clone the Repository
```bash
git clone https://github.com/Arnab27622/Aurora---Beyond-the-Interface.git
cd Aurora---Beyond-the-Interface
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Authentication (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_super_secret_random_string

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mychatbot

# AI API (Google Gemini)
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL_ID=gemini-pro

# Google Provider Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

#CSRF Secret
CSRF_SECRET=your_csrf_secret
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📖 Usage Guide

1.  **Sign Up**: Create an account to save your chat history.
2.  **Start Chatting**: Type a message or click the microphone 🎙️ icon to speak.
3.  **Upload Context**: Click the file/image icon to attach a PDF, Image, Word Doc, or Spreadsheet. Ask questions about the content of the file!
4.  **Management**: Use the sidebar to switch between past conversations or start a new one.

---

## 📂 Project Structure

```
├── .env.local
├── .eslintrc.json
├── .gitignore
├── components.json
├── jest.config.js
├── jest.setup.js
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── test-environment-validation.sh
├── tsconfig.json
├── public/
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/
    │   │   │   ├── [...nextauth]/route.ts
    │   │   │   ├── refresh/route.ts
    │   │   │   └── register/route.ts
    │   │   ├── chat/
    │   │   │   ├── constants.ts
    │   │   │   ├── content-builder.ts
    │   │   │   ├── error-handler.ts
    │   │   │   ├── gemini-client.ts
    │   │   │   ├── route.ts
    │   │   │   ├── sanitizer.ts
    │   │   │   ├── streaming.ts
    │   │   │   ├── types.ts
    │   │   │   └── validation.ts
    │   │   ├── chat-sessions/route.ts
    │   │   ├── csrf/route.ts
    │   │   └── search/route.ts
    │   ├── auth/
    │   │   ├── signin/page.tsx
    │   │   └── signup/page.tsx
    │   ├── DynamicClasses.tsx
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── chat/
    │   │   ├── AttachmentButtons.tsx
    │   │   ├── CachedBadge.tsx
    │   │   ├── ChatContainer.tsx
    │   │   ├── ChatHeader.tsx
    │   │   ├── ChatHistory.tsx
    │   │   ├── ChatInput.tsx
    │   │   ├── ChatMessage.tsx
    │   │   ├── ChatMessageDynamic.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── FileAttachment.tsx
    │   │   ├── FileContextIndicator.tsx
    │   │   ├── FilePreviewModal.tsx
    │   │   ├── HiddenFileInputs.tsx
    │   │   ├── InputField.tsx
    │   │   ├── ListeningIndicator.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── MessageList.tsx
    │   │   ├── MobileAttachmentDropdown.tsx
    │   │   ├── RegenerateButton.tsx
    │   │   ├── ResponseNavigator.tsx
    │   │   ├── ScrollToBottomButton.tsx
    │   │   ├── SendButton.tsx
    │   │   ├── SuggestedPrompts.tsx
    │   │   ├── ThinkingBubble.tsx
    │   │   ├── TypingIndicator.tsx
    │   │   └── markdown-components.tsx
    │   ├── errors/
    │   │   ├── ComponentErrorBoundary.tsx
    │   │   └── ErrorBoundary.tsx
    │   ├── ui/
    │   │   ├── LoadingSkeleton.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── copy-button.tsx
    │   │   ├── input.tsx
    │   │   └── scroll-area.tsx
    │   ├── AuthProvider.tsx
    │   └── ThemeProvider.tsx
    ├── lib/
    │   ├── hooks/
    │   │   ├── useChatState.ts
    │   │   ├── useFileHandling.ts
    │   │   ├── useMessageActions.ts
    │   │   └── useScrollManagement.ts
    │   ├── models/
    │   │   ├── ChatSession.ts
    │   │   └── User.ts
    │   ├── validations/
    │   │   └── auth.ts
    │   ├── auth.ts
    │   ├── cache.ts
    │   ├── csrf.ts
    │   ├── dynamicImportUtils.tsx
    │   ├── errorHandler.ts
    │   ├── fileDownload.ts
    │   ├── fileValidation.ts
    │   ├── lazyLoadConfig.tsx
    │   ├── logger.ts
    │   ├── mongodb.ts
    │   ├── rateLimit.ts
    │   ├── sanitize.test.ts
    │   ├── sanitize.ts
    │   ├── serverStartup.ts
    │   ├── streaming.ts
    │   ├── types.ts
    │   ├── useAsyncError.ts
    │   ├── useChatSessions.ts
    │   ├── useFileLoader.ts
    │   ├── useGemini.ts
    │   ├── useLazyLoad.ts
    │   ├── usePDFLoader.ts
    │   ├── useSpeechRecognition.ts
    │   ├── utils.ts
    │   └── validateEnvironment.ts
    └── middleware.ts
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
