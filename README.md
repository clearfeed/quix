# 🚀 Quix: AI-Powered Slack Agent

Quix is an AI-powered Slack agent that can interact with your business tools such as JIRA, GitHub, HubSpot and more. It allows users to interact with these services directly from Slack channels or through 1:1 chats.

## 🔗 Supported Integrations

- ![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)
- ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
- ![HubSpot](https://img.shields.io/badge/HubSpot-FF7A59?style=for-the-badge&logo=hubspot&logoColor=white)
- ![Zendesk](https://img.shields.io/badge/Zendesk-034F62?style=flat&logo=zendesk)

## ✨ Features

- **Slack Integration**: Quix can respond to queries when tagged in Slack channels. 🗨️
- **Multi-Service Querying**: Supports querying multiple tools.
- **Thread Context**: Quix can understand the context of a Slack thread when answering queries.
- **LLM Integration**: Powered by OpenAI and Google Generative AI models. 🧠
- **Modular Architecture**: Built with Nest.js for scalability and maintainability. 🏗️

## 🚀 Setting Up the Slack App

1. **Create a Slack App**:
   - Go to the [Slack API](https://api.slack.com/apps) and create a new app.
   - Choose "From an app manifest" and paste the contents of `slack_app_manifest.yml` from this repository.

2. **Update the Events Endpoint**:
   - In the manifest, replace `<EXPRESS_ENDPOINT>` with your server's public URL where Slack can send event notifications.

3. **Install the App to Your Workspace**:
   - Follow the instructions in the Slack API to install the app to your workspace.

## 📦 Project Structure

This project is a Nest.js monorepo with:
- Main Nest.js application in the root `src/` directory
- Integration packages in `agent-packages/packages/`
- Common utilities and shared types in `agent-packages/packages/common`

## 🛠️ Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**:
   ```bash
   yarn install
   ```

3. **Environment Configuration**:
   Copy the `.env.example` file to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables in `.env`:
   - `PORT`: Server port (default: 3000)
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_API_KEY`: Your Google Generative AI API key (optional)
   - `HUBSPOT_ACCESS_TOKEN`: Your HubSpot access token
   - `JIRA_API_TOKEN`: Your JIRA API token
   - `GITHUB_ACCESS_TOKEN`: Your GitHub access token
   - `SLACK_BOT_TOKEN`: Your Slack bot token
   - `SLACK_SIGNING_SECRET`: Your Slack signing secret
   - `ENCRYPTION_KEY`: Secret key for encrypting sensitive data (must be at least 32 characters)
   - `LOG_LEVEL`: Logging level (default: info)

6. **Start the Development Server**:
   ```bash
   yarn start:dev
   ```

7. **Build and Run for Production**:
   - Build the project:
     ```bash
     yarn build
     ```
   - Start the production server:
     ```bash
     yarn start:prod
     ```

## 🐳 Docker Deployment

You can also run the application using Docker:

```bash
# Build the Docker image
docker build -t quix .

# Run the container
docker run -p 3000:3000 --env-file .env quix
```

### Slack Events
Handles incoming Slack events and messages.

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
