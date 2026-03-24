# AI Dashboard

AI Dashboard is a lightweight web app that lets you chat with an AI assistant, summarize text, explain code, and generate ideas from a simple dashboard interface.

## Features

- Multi-tool interface: Chat, Summarizer, Code Explainer, and Idea Generator
- Local conversation history stored in the browser
- Node.js proxy server to keep the OpenRouter API key out of the frontend
- Markdown rendering with sanitization on AI responses

## Project Structure

```text
.
|-- css/
|   `-- style.css
|-- js/
|   `-- app.js
|-- server/
|   `-- server.js
|-- index.html
|-- package.json
`-- .env.example
```

## Requirements

- Node.js 18 or newer
- An OpenRouter API key

## Installation

```bash
npm install
```

Create a `.env` file at the project root:

```env
OPENROUTER_KEY=your_openrouter_api_key
```

You can copy the example file:

```bash
copy .env.example .env
```

## Run the Project

Start the backend server:

```bash
npm start
```

Then open `index.html` in your browser.

For the best experience, use a local static server or an editor extension such as Live Server.

## Security

The API key is now loaded from environment variables on the server side and is not exposed in the frontend code.

## Tech Stack

- HTML
- CSS
- JavaScript
- Express
- OpenRouter API
