<p align="center">
  <img src="icon.png" alt="description" width="75">
</p>

# Adorable

A modern AI-powered app builder with real-time streaming and beautiful UI generation.

## Features

- 🤖 AI-powered app building
- 🎨 Beautiful UI generation with modern design principles
- 📱 Responsive design for all devices
- 🚀 Real-time streaming capabilities
- 🔧 Enhanced tool messages and stream handling

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

---

*Last updated: Auto-deploy trigger* 🚀

## OpenRouter (DeepSeek) support

To enable the DeepSeek model via OpenRouter in the Model Selector:

Set the following environment variables in your deployment:

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_BASE_URL` (optional): Defaults to `https://openrouter.ai/api/v1`
- `OPENROUTER_REFERER` (optional): Your site URL for rankings on openrouter.ai
- `OPENROUTER_SITE_TITLE` (optional): Your site title for rankings on openrouter.ai

Then select "DeepSeek R1 (free)" in the model selector. The agent will route requests via OpenRouter.
