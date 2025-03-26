import { GithubConfig, HubspotConfig, JiraConfig, PostgresConfig, SalesforceConfig } from "@quix/database/models";
import { HomeViewArgs } from "@quix/slack/views/types";
import { INTEGRATIONS, SUPPORTED_INTEGRATIONS } from "../constants";

export const getToolConfigData = (connection: HomeViewArgs['connection']): string[] => {
  switch (true) {
  case connection instanceof JiraConfig:
    return [`👤 *Username:* ${connection.url}`];
  case connection instanceof HubspotConfig:
    return [`🌐 *Hub Domain:* ${connection.hub_domain}`];
  case connection instanceof PostgresConfig:
    return [
      `🛠️ *Host:* ${connection.host}`,
      `🗄️ *Database:* ${connection.database}`,
      `🔐 *User:* ${connection.user}`,
      `🔒 *SSL Enabled:* ${connection.ssl ? 'Yes' : 'No'}`
    ];
  case connection instanceof GithubConfig:
    return [`👤 *Username:* ${connection.username}`];
  case connection instanceof SalesforceConfig:
    return [
      `👤 *User:* ${connection.authed_user_email}`,
      `🌐 *Instance URL:* ${connection.instance_url}`
    ];
  default:
    return ['No config data.'];
  }
};

export const getCapabilities = (
  selectedTool: (typeof INTEGRATIONS)[number]["value"]
): string[] => {
  switch (selectedTool) {
  case SUPPORTED_INTEGRATIONS.JIRA:
    return [
      "Find all Jira issues mentioning payment failure",
      "What’s the status of `PROJ-256`?",
      "Create a bug in the `ABC` project titled 'Login button not responsive', assign it to `john.doe`, with high priority.",
      "Assign issue `PROJ-142` to `alice.smith`",
      "Add a comment to `PROJ-123`: 'Waiting for design team’s input.'",
      "Show me all comments on `PROJ-987`",
      "Update `PROJ-321`: change the summary to 'Onboarding flow issues', assign it to user ID `abc123`, and set priority to Medium.",
      "Search for users named `Rahul`"
    ];
  case SUPPORTED_INTEGRATIONS.HUBSPOT:
    return [
      "Find deals related to 'Website Redesign'",
      "Search HubSpot deals that mention 'Q2 renewal'",
      "Add a note to deal `934756`: 'Client approved the new pricing structure.'",
      "Attach a note saying 'Follow up next Tuesday' to deal ID `872390`",
      "Create a deal named 'Enterprise Website Project' worth $15,000 in negotiation stage",
      "Create a contact for `John Doe`, `john.doe@example.com`, phone: `+1234567890`"
    ];
  case SUPPORTED_INTEGRATIONS.POSTGRES:
    return [
      "What tables do we have in our database?",
      "What’s the schema of the `users` table?",
      "Show columns and data types of the `orders` table",
      "Give me the top 5 customers by `revenue`",
      "Show all `employees` from the `Sales department`",
      "Get `orders` placed in the last 7 days"
    ];
  case SUPPORTED_INTEGRATIONS.GITHUB:
    return [
      "Find all issues in the `backend` repo related to authentication bugs created by `johnsmith`",
      "Show me the details of issue number 72 in the `frontend/org-xyz` repo",
      "Assign issue #101 in website repo to user `alicehub`",
      "Unassign bobdev from issue #204 in `api-server` repo of `org-xyz`",
      "List all users in our GitHub org `openai-labs`",
      "Create an issue in the `react/facebook` repo titled 'Crash on launch' with description 'The app crashes immediately after opening on iOS 17.'",
      "Search for the keyword `useEffect` in the `dashboard-ui/imkhateeb` repository"
    ];
  case SUPPORTED_INTEGRATIONS.SALESFORCE:
    return [
      "Find all opportunities related to 'Website Upgrade'",
      "Add a note to opportunity ID `0065g00000XyZt2` saying 'Client asked for revised proposal'",
      "Attach a note titled 'Call Summary' to opportunity `0065g00000XyZt2`: 'Call went well, decision expected by next week.'",
      "Create a task for opportunity ID `0065g00000ABCXz` with subject 'Follow up with client', status 'Not Started', and priority 'High'",
      "Find Salesforce user with email `emily@company.com`",
    ];
  default:
    return [
      "Ask questions like:",
      "Give first 10 rows of `accounts` table.",
      "Create a GitHub issue titled Bug in Login flow in `xyz/pqr` repository.",
      "Create a deal named Website Upgrade worth $10,000 in stage negotiations.",
      "Assign jira issue PROJ-123 to xyz."
    ];
  }
};