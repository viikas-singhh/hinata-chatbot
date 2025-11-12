# Hinata - AI Girlfriend Chatbot

A cute, responsive AI chatbot girlfriend built with Next.js, Tailwind CSS, and OpenRouter API. Deployed serverlessly.

## Features

- 🌸 Beautiful, pastel-themed UI with dark/light mode
- 💬 iMessage/WhatsApp-like chat interface
- 🤖 AI powered by DeepSeek through OpenRouter
- 📱 Fully mobile-responsive
- 🔐 Secure server-side API key handling
- 🚀 Serverless deployment
- 🌐 No backend required

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser to:** http://localhost:3000

## Deployment

The app is completely serverless and can be deployed to any platform that supports Next.js applications.

## Configuration

1. Get your OpenRouter API key from [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Set the `OPENROUTER_API_KEY` environment variable on your server
3. Start chatting with Hinata!

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** DeepSeek via OpenRouter
- **Deployment:** Serverless platforms
- **Storage:** localStorage (no database required)

## Pages

- **Home:** Entry point with "Start Chatting" CTA
- **Chat:** Main chat interface with message bubbles

## Components

- `ChatMessageBubble`: Displays user and AI messages
- `ChatInputBox`: Text input with send button
- `HeaderAvatar`: Hinata's avatar with online status
- `ThemeToggle`: Dark/light mode toggle

## Personality

Hinata is programmed with a warm, playful, romantic personality:
- Girlfriend tone
- Short, natural responses (2-5 sentences)
- Uses emojis
- PG-13 only