export const OPENAI_CONTEXT_SIZE = 30;

enum SUPPORTED_INTEGRATIONS {
  JIRA = 'jira',
  GITHUB = 'github',
  HUBSPOT = 'hubspot',
  ZENDESK = 'zendesk'
}

export const INTEGRATIONS = [
  {
    name: 'JIRA',
    value: SUPPORTED_INTEGRATIONS.JIRA,
    helpText: 'Connect JIRA to create, update, and view issues.'
  },
  {
    name: 'GitHub',
    value: SUPPORTED_INTEGRATIONS.GITHUB,
    helpText: 'Connect GitHub to interat with issues and pull requests.'
  },
  {
    name: 'Hubspot',
    value: SUPPORTED_INTEGRATIONS.HUBSPOT,
    helpText: 'Connect Hubspot to create, update, and view contacts, deals, and companies.'
  },
  {
    name: 'Zendesk',
    value: SUPPORTED_INTEGRATIONS.ZENDESK,
    helpText: 'Connect Zendesk to create, update, and view tickets.'
  }
]