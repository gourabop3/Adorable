<p align="center">
  <img src="icon.png" alt="description" width="75">
</p>

# Vibe

A modern AI-powered app builder with real-time streaming, beautiful UI generation, and Vercel deployment support.

## Features

- 🤖 AI-powered app building
- 🎨 Beautiful UI generation with modern design principles
- 📱 Responsive design for all devices
- 🚀 Real-time streaming capabilities
- 🔧 Enhanced tool messages and stream handling
- 🚀 Vercel deployment integration
- 🎯 Dual deployment options (Freestyle + Vercel)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production

- Build: `npm run build`
- Start: `npm run start`

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- AI SDK integration
- Vercel deployment
- Groq AI models

---

*Last updated: Vercel auto-deploy trigger* 🚀

## OpenAI-compatible provider (ChatAnywhere)

To enable ChatAnywhere via the model selector:

Set environment variables in your deployment:

- `OPENAI_COMPAT_API_KEY` (or `CHATANYWHERE_API_KEY`): Your provider API key
- `OPENAI_COMPAT_BASE_URL` (optional): Defaults to `https://api.chatanywhere.tech/v1`

Then select "GPT-4o (ChatAnywhere)" in the model selector. The agent will route requests via the configured OpenAI-compatible endpoint.
