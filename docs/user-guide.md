# SambungChat User Guide

**Version:** 1.0
**Last Updated:** January 16, 2026
**Target Audience:** End Users
**License:** AGPL-3.0

---

## Welcome to SambungChat

SambungChat is a self-hosted, privacy-first AI chat platform that lets you connect with any AI model. This guide will help you get started and make the most of SambungChat's features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation](#navigation)
3. [Features](#features)
4. [Settings](#settings)
5. [Teams](#teams)
6. [FAQ](#faq)

---

## Getting Started

### First Time Setup

1. **Create an account**
   - Click "Sign Up" on the login page
   - Choose a username and password
   - Or use Keycloak SSO if enabled

2. **Start chatting**
   - You'll be redirected to the chat interface
   - Select an AI model from the dropdown
   - Type your message and press Enter or click Send

3. **Configure AI providers** (optional)
   - Go to Settings → API Keys
   - Add your OpenAI, Anthropic, or other provider keys
   - Your keys are stored encrypted

---

## Navigation

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header (SambungChat logo)                              │
├────┬──────────────────────────┬─────────────────────────┤
│Nav │  Sidebar                 │  Content Area           │
│Rail│  (context-aware)          │                         │
│64px│                          │                         │
│ 💬 │ Recent chats             │ Chat Interface          │
│ 🤖 │ Folders                  │ Agent Library           │
│ ✨ │ Search                   │ Prompt Library          │
│ 👥 │                          │                         │
│────┼──────────────────────────┴─────────────────────────┤
│ 👤 │ User avatar (menu, settings, logout)              │
└────┴─────────────────────────────────────────────────────┘
```

### Navigation Elements

**Navigation Rail (Left):**

- 💬 **Chat** - Main chat interface
- 🤖 **Agents** - AI agent library
- ✨ **Prompts** - Prompt templates
- 👥 **Team** - Team workspace (if you're in a team)

**Sidebar:**

- Shows context-aware content based on navigation
- Chat history, agent categories, or prompt library
- Collapsible with `Cmd/Ctrl + B`

**User Menu:**

- Click avatar to access settings and logout

---

## Features

### Chat

**Create a new chat:**

1. Click [+ New Chat] in the sidebar
2. Select an AI model
3. Start typing

**Chat features:**

- **Model selection** - Choose from OpenAI, Anthropic, Google, Groq, Ollama
- **Streaming responses** - See AI responses in real-time
- **Markdown rendering** - Rich text formatting with syntax highlighting
- **Message actions** - Copy, delete, or regenerate messages

**Organize chats:**

- **Folders** - Create folders to organize your chats
- **Pinning** - Pin important chats to the top
- **Search** - Find chats by keyword or tag

---

### Agents

**What are Agents?**
Agents are AI assistants with specific capabilities and personalities.

**Agent categories:**

- **My Agents** - Agents you've created
- **Marketplace** - Public agents shared by developers
- **Shared with me** - Private agents shared by others

**Create an agent:**

1. Go to Agents tab
2. Click [+ Create Agent]
3. Configure name, description, and behavior
4. Set visibility (personal/team/public)

**Use an agent:**

- Click on an agent card
- Start chatting with the agent
- Agent maintains its configured behavior

---

### Prompts

**What are Prompts?**
Prompts are reusable message templates with variables.

**Prompt categories:**

- **My Prompts** - Prompts you've created
- **Marketplace** - Public prompts shared by developers
- **Shared with me** - Private prompts shared by others

**Use a prompt:**

1. Go to Prompts tab
2. Browse or search for a prompt
3. Click "Use this prompt"
4. Fill in variables if needed
5. Send to AI

**Create a prompt:**

1. Click [+ Create Prompt]
2. Add name and description
3. Write your prompt template with `{{variable}}` syntax
4. Save and optionally publish to marketplace

---

## Settings

### Profile Settings

- **Display name** - Change your displayed name
- **Email** - Update email address
- **Avatar** - Upload or change profile picture

### Appearance

- **Theme** - Toggle between light and dark mode
- **Font size** - Adjust text size for comfort
- **Sidebar width** - Customize sidebar width

### API Keys

**Why add API keys?**
To use AI models, you need to add your provider API keys. Keys are encrypted and stored securely.

**Supported providers:**

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Groq
- Ollama (local models)

**Add an API key:**

1. Go to Settings → API Keys
2. Click [+ Add Key]
3. Select provider
4. Paste your API key
5. Save

### Language

- Select your preferred language
- Language affects UI and some AI responses

---

## Teams

### What are Teams?

Teams allow you to collaborate with others on chats, agents, and prompts.

### Team Features

**Dashboard**

- View team analytics
- See member activity
- Track usage statistics

**Members**

- Invite new members
- Manage roles and permissions
- View member list

**Settings**

- Team name and avatar
- Permissions and access control
- Billing and limits

### Create a Team

1. Click 👥 Team icon in navigation rail
2. Click [+ Create Team]
3. Enter team name and description
4. Invite members via email
5. Start collaborating

---

## Keyboard Shortcuts

| Shortcut               | Action                         |
| ---------------------- | ------------------------------ |
| `Cmd/Ctrl + B`         | Toggle sidebar                 |
| `Cmd/Ctrl + K`         | Quick search / command palette |
| `Cmd/Ctrl + N`         | New chat                       |
| `Cmd/Ctrl + Shift + N` | New prompt                     |
| `Escape`               | Close dropdown/popups          |
| `?`                    | Show keyboard shortcuts        |

---

## FAQ

### General

**Q: Is SambungChat free?**
A: Yes, SambungChat is open-source (AGPL-3.0) and free to self-host. You only pay for the AI provider usage.

**Q: Can I use SambungChat offline?**
A: Yes, if you use local models like Ollama, SambungChat works completely offline.

**Q: Is my data private?**
A: Yes, SambungChat is privacy-first. Your data is stored on your server, and you have full control.

### Technical

**Q: What AI models are supported?**
A: SambungChat supports OpenAI, Anthropic, Google, Groq, and Ollama models.

**Q: Can I add my own AI provider?**
A: Yes, see our [AI Provider Integration Guide](../docs/ai-provider-integration-guide.md).

**Q: How do I deploy SambungChat?**
A: See our [Deployment Guide](../docs/deployment.md).

### Troubleshooting

**Q: AI responses are slow**
A: Check your API key configuration and provider status. Try switching to a different model.

**Q: I can't see my chats**
A: Make sure you're logged in. Try refreshing the page or clearing browser cache.

**Q: Sidebar won't collapse**
A: Try the keyboard shortcut `Cmd/Ctrl + B`. If it still doesn't work, check browser console for errors.

---

## Need Help?

- **Documentation:** [../docs/index.md](../docs/index.md)
- **Troubleshooting:** [../docs/troubleshooting.md](../docs/troubleshooting.md)
- **GitHub Issues:** [Report a bug](https://github.com/yourusername/sambung-chat/issues)
- **Discussions:** [Ask a question](https://github.com/yourusername/sambung-chat/discussions)

---

## What's Next?

- Explore the **Marketplace** for agents and prompts
- **Create your own agents** with custom behaviors
- **Invite your team** to collaborate
- **Customize your settings** for the best experience

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
