# OpenAI Function Calling with HubSpot Integration

This project implements a Node.js API that uses OpenAI's function calling feature to search HubSpot deals based on natural language queries.

## Features

- Express.js HTTP API
- OpenAI GPT-4 Turbo integration with function calling
- HubSpot CRM integration for deal search
- TypeScript support
- Logging with Winston
- Environment variable configuration
- CORS enabled

## Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- OpenAI API key
- HubSpot access token

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Copy the `.env.example` file to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

4. Configure the following environment variables in `.env`:
   - `PORT`: Server port (default: 3000)
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `HUBSPOT_ACCESS_TOKEN`: Your HubSpot access token
   - `LOG_LEVEL`: Logging level (default: info)

## Development

Start the development server:
```bash
yarn dev
```

## Build and Run

Build the project:
```bash
yarn build
```

Start the production server:
```bash
yarn start
```

## API Endpoints

### POST /query
Search for HubSpot deals using natural language.

Request body:
```json
{
  "message": "Find all HubSpot deals related to ClearFeed"
}
```

Response:
```json
{
  "success": true,
  "result": {
    "type": "function_result",
    "function": "search_hubspot_deals",
    "result": {
      "success": true,
      "deals": [
        {
          "id": "123",
          "name": "ClearFeed Enterprise Deal",
          "amount": "50000",
          "stage": "closedwon",
          "closeDate": "2024-03-15",
          "pipeline": "default"
        }
      ]
    }
  }
}
```

### GET /health
Health check endpoint.

Response:
```json
{
  "status": "ok"
}
```

## Future Extensions

- Support for additional tools (JIRA, GitHub)
- Dynamic function registration
- Extended CRM operations (deal creation, updates)
- Authentication and rate limiting
- Caching layer for improved performance

## Logging

Logs are stored in the `logs` directory:
- `logs/error.log`: Error-level logs
- `logs/combined.log`: All logs

## License

MIT 