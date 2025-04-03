# 🚀 Quix: AI-Powered Slack Agent

Quix is an AI-powered Slack agent that can interact with your business tools such as JIRA, GitHub, HubSpot and more. It allows users to interact with these services directly from Slack channels or through 1:1 chats.

## 🔗 Supported Integrations

- ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) - Repository and code management
- ![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white) - Project and issue tracking
- ![HubSpot](https://img.shields.io/badge/HubSpot-FF7A59?style=for-the-badge&logo=hubspot&logoColor=white) - CRM and marketing
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) - Database queries

## ✨ Key Features

- **AI-Powered Interactions**: Leverages OpenAI for intelligent responses
- **Slack Integration**: Natural language interactions through Slack channels and DMs
- **Multi-Service Integration**: Seamlessly connects with multiple business tools
- **Modular Architecture**: Built on Nest.js with a scalable monorepo structure

## 🏗️ Project Structure

```
├── src/                    # Main Nest.js application
│   ├── lib/               # Core libraries
│   ├── llm/               # LLM integration
│   ├── integrations/      # Service integrations
│   ├── slack/             # Slack bot functionality
│   └── database/          # Database configurations
│
├── agent-packages/        # Integration packages
│   └── packages/
│       ├── common/        # Shared utilities and types
│       ├── github/        # GitHub integration
│       ├── jira/          # Jira integration
│       ├── hubspot/       # HubSpot integration
│       └── postgres/      # PostgreSQL integration
```

## 🛠️ Setup and Installation

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd quix
   ```

2. **Install Dependencies**:

   ```bash
   yarn install
   ```

3. **Environment Configuration**:

   ```bash
   cp .env.example .env
   ```

   Configure the following in your `.env`:

   - `PORT`: Server port (default: 3000)
   - `OPENAI_API_KEY`: OpenAI API key
   - `SLACK_BOT_TOKEN`: Slack bot token
   - `SLACK_SIGNING_SECRET`: Slack signing secret
   - Integration-specific keys (GitHub, Jira, HubSpot)
   - Database and Redis configurations

4. **Slack App Setup**:

   a. **For Local Development**:

   ```bash
   # Install ngrok or similar tool for tunneling
   brew install ngrok  # macOS
   # or
   npm install -g ngrok  # Using npm

   # Start your application
   yarn start:dev

   # In a new terminal, create a tunnel
   ngrok http 3000
   ```

   b. **Create and Configure the Slack App**:

   1. Go to [Slack API Dashboard](https://api.slack.com/apps)
   2. Click "Create New App" → "From an app manifest"
   3. Select your workspace and click "Next"
   4. Copy the contents of `slack_app_manifest.yml`
   5. Replace the placeholder URLs in the manifest:

      - `<YOUR_EVENTS_URL>` → `https://your-domain/slack/events`
      - `<YOUR_INTERACTIONS_URL>` → `https://your-domain/slack/interactions`
      - `<YOUR_REDIRECT_URL>` → `https://your-domain/slack/oauth/callback`

      For local development, use your ngrok URL: `https://your-ngrok-url.ngrok.io/slack/...`

      For production, use your actual domain: `https://your-domain.com/slack/...`

   6. Click "Create"

   c. **Install the App**:

   1. Navigate to "OAuth & Permissions" in your Slack app settings
   2. Click "Install to Workspace"
   3. Copy the "Bot User OAuth Token" and add it to your `.env` as `SLACK_BOT_TOKEN`
   4. Go to "Basic Information" and copy the "Signing Secret" to your `.env` as `SLACK_SIGNING_SECRET`

5. **Database Setup**:

   ```bash
   yarn db:migrate
   ```

6. **Development Mode**:

   ```bash
   yarn start:dev
   ```

7. **Production Build**:
   ```bash
   yarn build
   yarn start:prod
   ```

## 🐳 Docker Support

Run with Docker:

```bash
# Build the image
docker build -t quix .

# Run with environment variables
docker run -p 3000:3000 --env-file .env quix
```

Or use Docker Compose for local development:

```bash
docker-compose -f docker-compose.local.yml up
```

## 🧩 Extending the Platform

1. Create a new integration package:

   ```bash
   cd agent-packages/packages
   mkdir new-integration
   ```

2. Follow the package structure:

   - `src/index.ts` - Main exports
   - `src/types.ts` - Type definitions
   - `src/tools.ts` - Integration tools

3. Build and link the package:
   ```bash
   ./link.sh
   ```

### Health Check

`GET /health` - Health check endpoint.

## 🧩 Extending with New Integrations

To add a new integration:

1. Create a new package in `agent-packages/packages/`
2. Implement the integration following the common package structure
3. Build and link the new package
4. Import and register the package in the main application

## 📜 License

Apache License, Version 2.0

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
