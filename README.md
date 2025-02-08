# 🚀 Quix: AI-Powered Slack Agent

Quix is an AI-powered Slack agent that can query JIRA, GitHub, and HubSpot, with support for more tools coming soon. It allows users to interact with these services directly from Slack channels or through 1:1 chats.

## 🔗 Supported Integrations

- ![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)
- ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
- ![HubSpot](https://img.shields.io/badge/HubSpot-FF7A59?style=for-the-badge&logo=hubspot&logoColor=white)

## ✨ Features

- **Slack Integration**: Quix can respond to queries when tagged in Slack channels. 🗨️
- **Multi-Service Querying**: Supports querying multiple tools.
- **User Query Endpoint**: Exposes an endpoint to accept user queries. 🔍
- **Future Plans**: Includes accepting the context of a conversation for more personalized responses.

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
   - `HUBSPOT_ACCESS_TOKEN`: Your HubSpot access token
   - `JIRA_API_TOKEN`: Your JIRA API token
   - `GITHUB_ACCESS_TOKEN`: Your GitHub access token
   - `SLACK_BOT_TOKEN`: Your Slack bot token
   - `LOG_LEVEL`: Logging level (default: info)

4. **Start the Development Server**:
   ```bash
   yarn dev
   ```

5. **Build and Run**:
   - Build the project:
     ```bash
     yarn build
     ```
   - Start the production server:
     ```bash
     yarn start
     ```

## 🌐 API Endpoints

### POST /query
Accepts user queries to interact with integrated services.

### GET /health
Health check endpoint.

## Future Extensions

- Support for additional tools
- Dynamic function registration
- Extended CRM operations
- Authentication and rate limiting
- Caching layer for improved performance

## 📜 License

Apache License, Version 2.0 