export const OPENAI_CONTEXT_SIZE = 30;

export enum SUPPORTED_INTEGRATIONS {
  JIRA = 'jira',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  ZENDESK = 'zendesk'
}

export const INTEGRATIONS = [
  {
    name: 'JIRA',
    value: SUPPORTED_INTEGRATIONS.JIRA,
    helpText: 'Connect JIRA to create, update, and view issues.',
    connectedText: 'Jira has been successfully connected! You can now query Jira by mentioning me in any channel. Try asking me things like "Show me my assigned tickets" or "What are the open bugs?"'
  },
  {
    name: 'GitHub',
    value: SUPPORTED_INTEGRATIONS.GITHUB,
    helpText: 'Connect GitHub to interat with issues and pull requests.',
    connectedText: 'GitHub has been successfully connected! You can now query GitHub by mentioning me in any channel. Try asking me things like "Show me my issues" or "What are the open pull requests?"'
  },
  {
    name: 'Hubspot',
    value: SUPPORTED_INTEGRATIONS.HUBSPOT,
    helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.',
    connectedText: 'Hubspot has been successfully connected! You can now query Hubspot by mentioning me in any channel. Try asking me things like "Show me my contacts" or "What are the open deals?"'
  },
  {
    name: 'Zendesk',
    value: SUPPORTED_INTEGRATIONS.ZENDESK,
    helpText: 'Connect Zendesk to create, update, and view tickets.',
    connectedText: 'Zendesk has been successfully connected! You can now query Zendesk by mentioning me in any channel. Try asking me things like "Show me my tickets" or "What are the open tickets?"'
  }
]