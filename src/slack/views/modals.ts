import { Elements, BlockCollection, ContextBuilder, Md, SectionBuilder } from 'slack-block-builder';
import { SLACK_ACTIONS } from '@quix/lib/utils/slack-constants';
import { Block, View } from '@slack/web-api';
import { Bits, Section, Input, Image } from 'slack-block-builder';
import {
  JiraDefaultConfigModalArgs,
  PostgresConnectionModalArgs,
  NotionConnectionModalArgs,
  LinearConnectionModalArgs,
  DisplayErrorModalPayload,
  DisplayErrorModalResponse,
  UpdateModalResponsePayload,
  McpConnectionModalArgs,
  GithubDefaultConfigModalArgs,
  SalesforceConfigModalArgs,
  HubspotConfigModalArgs,
  OktaConnectionModalArgs,
  ConnectionInfo,
  ZendeskConnectionModalArgs,
  JumpCloudConnectionModalArgs
} from './types';
import { WebClient } from '@slack/web-api';
import { Surfaces } from 'slack-block-builder';
import { QuixUserAccessLevel } from '@quix/lib/constants';
import { isSlackWebClientError } from '@quix/lib/utils/slack';

export const getPostgresConnectionModal = (args: PostgresConnectionModalArgs): Block[] => {
  const { initialValues } = args;

  return BlockCollection([
    Section({
      text: 'Please provide your PostgreSQL connection details:'
    }),
    Input({
      label: 'Host',
      blockId: 'postgres_host'
    }).element(
      Elements.TextInput({
        placeholder: 'e.g., localhost or db.example.com',
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST
      }).initialValue(initialValues?.host || '')
    ),
    Input({
      label: 'Port',
      blockId: 'postgres_port'
    }).element(
      Elements.TextInput({
        placeholder: 'e.g., 5432',
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT
      }).initialValue(initialValues?.port || '5432')
    ),
    Input({
      label: 'Database',
      blockId: 'postgres_database'
    }).element(
      Elements.TextInput({
        placeholder: 'e.g., mydb',
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE
      }).initialValue(initialValues?.database || '')
    ),
    Input({
      label: 'Username',
      blockId: 'postgres_username'
    }).element(
      Elements.TextInput({
        placeholder: 'e.g., postgres',
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER
      }).initialValue(initialValues?.username || '')
    ),
    Input({
      label: 'Password',
      blockId: 'postgres_password'
    }).element(
      Elements.TextInput({
        placeholder: 'Your database password',
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD
      }).initialValue(initialValues?.password || '')
    ),
    Input({
      label: 'SSL',
      blockId: 'postgres_ssl'
    })
      .element(
        Elements.Checkboxes({
          actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SSL
        })
          .initialOptions(
            initialValues?.ssl
              ? [
                  Bits.Option({
                    text: 'Use SSL connection',
                    value: 'ssl'
                  })
                ]
              : []
          )
          .options([
            Bits.Option({
              text: 'Use SSL connection',
              value: 'ssl'
            })
          ])
      )
      .optional(true),
    Section({
      text: 'Your credentials are securely stored and only used to connect to your database.'
    }),
    Input({
      label: 'Default Prompt',
      blockId: 'postgres_default_prompt',
      hint: 'Please provide a default prompt for PostgreSQL. This will be used when Quix needs to query or update the database.'
    })
      .optional(true)
      .element(
        Elements.TextInput({
          placeholder: 'When querying data from the PostgreSQL database...',
          multiline: true,
          actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DEFAULT_PROMPT,
          initialValue: args.initialValues?.defaultPrompt || ''
        })
      )
  ]);
};

/**
 * Publishes a modal to collect PostgreSQL connection details
 */
export const publishPostgresConnectionModal = async (
  client: WebClient,
  args: PostgresConnectionModalArgs
): Promise<void> => {
  try {
    const modal = getPostgresConnectionModal(args);

    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'PostgreSQL Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SUBMIT
        }).buildToObject(),
        blocks: modal,
        private_metadata: JSON.stringify({
          id: args.initialValues?.id
        })
      }
    });
  } catch (error) {
    console.error('Error publishing PostgreSQL connection modal:', error);
    throw error;
  }
};

export const publishOpenaiKeyModal = async (
  client: WebClient,
  args: {
    triggerId: string;
    teamId: string;
  }
): Promise<void> => {
  await client.views.open({
    trigger_id: args.triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'OpenAI Key',
        submit: 'Submit',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.OPENAI_API_KEY_MODAL.SUBMIT
      }).buildToObject(),
      blocks: BlockCollection([
        Section({
          text: 'Please enter your OpenAI API key:'
        }),
        Input({
          label: 'OpenAI API Key',
          blockId: 'openai_api_key'
        }).element(
          Elements.TextInput({
            placeholder: 'sk-...',
            actionId: SLACK_ACTIONS.OPENAI_API_KEY_MODAL.OPENAI_API_KEY_INPUT
          })
        )
      ])
    }
  });
};

export const publishManageAdminsModal = async (
  client: WebClient,
  args: {
    triggerId: string;
    teamId: string;
    initialUsers?: string[];
  }
): Promise<void> => {
  await client.views.open({
    trigger_id: args.triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'Manage Admins',
        submit: 'Submit',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.MANAGE_ADMINS
      }).buildToObject(),
      blocks: BlockCollection([
        Section({
          text: 'Please enter a list of users you want to add as admins:'
        }),
        Input({
          label: 'Users',
          blockId: 'admin_user_ids'
        }).element(
          Elements.ConversationMultiSelect({
            placeholder: 'e.g., @john.doe, @jane.doe',
            actionId: SLACK_ACTIONS.MANAGE_ADMINS_INPUT
          })
            .filter('im')
            .excludeBotUsers(true)
            .excludeExternalSharedChannels(true)
            .maxSelectedItems(10)
            .initialConversations(args.initialUsers || [])
        )
      ])
    }
  });
};

export const publishJiraConfigModal = async (
  client: WebClient,
  args: JiraDefaultConfigModalArgs
): Promise<void> => {
  const { triggerId, projectKey } = args;

  await client.views.open({
    trigger_id: triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'Jira Configuration',
        submit: 'Submit',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.JIRA_CONFIG_MODAL.SUBMIT
      }).buildToObject(),
      blocks: BlockCollection([
        Section({
          text: 'Please enter your Jira Project details:'
        }),
        Input({
          label: 'Project Key',
          blockId: 'project_key',
          hint: 'Quix will create JIRAs under this project by default'
        })
          .optional(true)
          .element(
            Elements.TextInput({
              placeholder: 'e.g., PROJ',
              actionId: SLACK_ACTIONS.JIRA_CONFIG_MODAL.PROJECT_KEY_INPUT,
              initialValue: projectKey
            })
          ),
        Input({
          label: 'Default Prompt',
          blockId: 'jira_default_prompt',
          hint: 'Please provide a default prompt for Jira. This will be used when Quix needs to create, fetch, or update issues in Jira.'
        })
          .optional(true)
          .element(
            Elements.TextInput({
              placeholder: 'When creating or searching Jira issues...',
              multiline: true,
              actionId: SLACK_ACTIONS.JIRA_CONFIG_MODAL.DEFAULT_PROMPT,
              initialValue: args.defaultPrompt || ''
            })
          )
      ])
    }
  });
};

export const publishGithubConfigModal = async (
  client: WebClient,
  args: GithubDefaultConfigModalArgs
): Promise<void> => {
  const { triggerId, initialValues } = args;

  await client.views.open({
    trigger_id: triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'GitHub Configuration',
        submit: 'Submit',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.GITHUB_CONFIG_MODAL.SUBMIT
      }).buildToObject(),
      blocks: BlockCollection([
        Section({
          text: 'Please enter your GitHub repository details:'
        }),
        Input({
          label: 'Repository',
          blockId: 'repo',
          hint: 'Quix will default to this repository for answering queries and performing tasks.'
        })
          .optional(true)
          .element(
            Elements.TextInput({
              placeholder: 'e.g., my-awesome-repo',
              actionId: SLACK_ACTIONS.GITHUB_CONFIG_MODAL.REPO_INPUT,
              initialValue: initialValues?.repo || ''
            })
          ),
        Input({
          label: 'Repository Owner',
          blockId: 'owner',
          hint: 'Quix will default to this owner for answering queries and performing tasks.'
        })
          .optional(true)
          .element(
            Elements.TextInput({
              placeholder: 'e.g., org-name',
              actionId: SLACK_ACTIONS.GITHUB_CONFIG_MODAL.OWNER_INPUT,
              initialValue: initialValues?.owner || ''
            })
          ),
        Input({
          label: 'Default Prompt',
          blockId: 'github_default_prompt',
          hint: 'Please provide a default prompt for GitHub. This will be used when Quix needs to interact with repositories, issues, or pull requests.'
        })
          .optional(true)
          .element(
            Elements.TextInput({
              placeholder: 'When searching issues or PRs on GitHub...',
              multiline: true,
              actionId: SLACK_ACTIONS.GITHUB_CONFIG_MODAL.DEFAULT_PROMPT,
              initialValue: args.initialValues?.defaultPrompt || ''
            })
          )
      ])
    }
  });
};

export const publishAccessControlModal = async (
  client: WebClient,
  args: {
    triggerId: string;
    teamId: string;
    initialChannels?: string[];
    initialAccessLevel?: QuixUserAccessLevel;
  }
): Promise<void> => {
  await client.views.open({
    trigger_id: args.triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'Access Controls',
        submit: 'Save',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS
      }).buildToObject(),
      blocks: BlockCollection([
        // Channel selection
        Section({
          text: 'Select channels where Quix is allowed to respond. If no channel is selected, Quix will respond in all channels:'
        }),
        Input({
          label: 'Allowed Channels',
          blockId: 'allowed_channel_ids'
        })
          .optional(true)
          .element(
            Elements.ConversationMultiSelect({
              actionId: SLACK_ACTIONS.ALLOWED_CHANNELS_SELECT,
              placeholder: 'Select channels'
            })
              .filter('public')
              .excludeBotUsers(true)
              .initialConversations(args.initialChannels || [])
          ),

        // Access Level selection
        Input({
          label: 'Who can interact with Quix in DM?',
          blockId: 'access_level'
        })
          .optional(true)
          .element(
            Elements.StaticSelect({
              actionId: SLACK_ACTIONS.ACCESS_LEVEL_SELECT,
              placeholder: 'Select access level'
            })
              .options([
                Bits.Option({
                  text: 'Everyone',
                  value: QuixUserAccessLevel.EVERYONE
                }),
                Bits.Option({
                  text: 'Admins Only',
                  value: QuixUserAccessLevel.ADMINS_ONLY
                })
              ])
              .initialOption(
                args.initialAccessLevel
                  ? Bits.Option({
                      text:
                        args.initialAccessLevel === QuixUserAccessLevel.EVERYONE
                          ? 'Everyone'
                          : 'Admins Only',
                      value: args.initialAccessLevel
                    })
                  : undefined
              )
          )
      ])
    }
  });
};

export const publishNotionConnectionModal = async (
  client: WebClient,
  args: NotionConnectionModalArgs
): Promise<void> => {
  try {
    const blocks = [
      Section({
        text: 'Please provide your Notion API token:'
      }),
      Input({
        label: 'API Token',
        blockId: 'notion_token',
        hint: args.initialValues?.apiToken
          ? 'Current token is not displayed for security reasons. Enter a new token to update it.'
          : 'Get your token at https://www.notion.so/my-integrations'
      }).element(
        Elements.TextInput({
          placeholder: args.initialValues?.apiToken ? 'Enter new token to update' : 'secret_...',
          actionId: SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.API_TOKEN
        })
      ),
      Image({
        imageUrl: 'https://cdn.clearfeed.app/quix/notion-page-connection.png',
        altText: 'Share Notion page with integration',
        title: 'Important: Share your Notion pages'
      }),
      Section({
        text: 'After connecting, make sure to share your Notion pages with the integration as shown in the image above.'
      }),
      Input({
        label: 'Default Prompt',
        blockId: 'notion_default_prompt',
        hint: 'Please provide a default prompt for Notion. This will be used when Quix needs to search, create, or update Notion pages or databases.'
      })
        .optional(true)
        .element(
          Elements.TextInput({
            placeholder: 'When retrieving notes or project data from Notion...',
            multiline: true,
            actionId: SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.DEFAULT_PROMPT,
            initialValue: args.initialValues?.defaultPrompt || ''
          })
        )
    ];
    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'Notion Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.NOTION_CONNECTION_ACTIONS.SUBMIT
        }).buildToObject(),
        blocks: BlockCollection(blocks)
      }
    });
  } catch (error) {
    console.error('Error publishing Notion connection modal:', error);
    throw error;
  }
};

export const publishLinearConnectionModal = async (
  client: WebClient,
  args: LinearConnectionModalArgs
): Promise<void> => {
  try {
    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'Linear Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.SUBMIT
        }).buildToObject(),
        blocks: BlockCollection([
          Section({
            text: 'Please enter your Linear API key:'
          }),
          Input({
            label: 'API Key',
            blockId: 'linear_api_key',
            hint: args.initialValues?.apiToken
              ? 'Current token is not displayed for security reasons. Enter a new token to update it.'
              : 'Get your token at https://linear.app/settings/api'
          }).element(
            Elements.TextInput({
              placeholder: args.initialValues?.apiToken
                ? 'Enter new token to update'
                : 'lin_api_...',
              actionId: SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.API_TOKEN
            })
          ),
          Section({
            text: 'You can find your Linear API key in Linear settings > Security & Access > Personal API keys'
          }),
          Input({
            label: 'Default Prompt',
            blockId: 'linear_default_prompt',
            hint: 'Please provide a default prompt for Linear. This will be used when Quix interacts with Linear issues, cycles, or projects.'
          })
            .optional(true)
            .element(
              Elements.TextInput({
                placeholder: 'When listing or creating issues in Linear...',
                multiline: true,
                actionId: SLACK_ACTIONS.LINEAR_CONNECTION_ACTIONS.DEFAULT_PROMPT,
                initialValue: args.initialValues?.defaultPrompt || ''
              })
            )
        ])
      }
    });
  } catch (error) {
    console.error('Error publishing Linear connection modal:', error);
    throw error;
  }
};

export const displayErrorModal = async (
  payload: DisplayErrorModalPayload
): Promise<DisplayErrorModalResponse> => {
  const { error, title } = payload;

  const errorMetadata = payload.errorMetadata ?? {};
  try {
    // ignoring  Modal was closed before updating the view errors
    if (isSlackWebClientError(error) && error?.data?.error === 'expired_trigger_id') {
      if (error.data.error === 'not_found') {
        console.log('Modal already closed');
        return;
      }
    }

    const errorMessage = ((): string => {
      if (Array.isArray(error.response?.message)) {
        return error.response.message.join('\n');
      }

      return error.message;
    })();

    const blocks: (SectionBuilder | ContextBuilder)[] = [
      Section().text(`${Md.emoji('warning')} ${payload.message ?? errorMessage}`)
    ];
    const view: View = Surfaces.Modal({
      title: title ?? 'Error'
    })
      .blocks(blocks)
      .buildToObject();
    console.error(error, errorMetadata);
    if ('triggerId' in payload) {
      return await payload.web.views.open({
        trigger_id: payload.triggerId,
        view
      });
    } else {
      if (payload.backgroundCaller === false) {
        return {
          response_action: 'update',
          view
        };
      } else {
        if (!payload.web) {
          throw new Error('Web client is required');
        }
        return await payload.web.views.update({
          view_id: payload.viewId,
          view
        });
      }
    }
  } catch (e) {
    console.error(e, `Error while displaying error screen ${JSON.stringify(errorMetadata)}`);
  }
};

export const displayLoadingModal = (
  title: string,
  closeButtonText?: string
): UpdateModalResponsePayload => {
  return {
    response_action: 'update',
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: title
      },
      ...(closeButtonText && {
        close: {
          type: 'plain_text',
          text: closeButtonText
        }
      }),
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${Md.emoji('hourglass_flowing_sand')} Please wait while we are processing your request.`
          }
        }
      ]
    }
  };
};

export const displaySuccessModal = async (
  client: WebClient,
  args: {
    viewId: string;
    text: string;
    title?: string;
  }
): Promise<void> => {
  const { viewId, text, title } = args;
  const blocks = [Section().text(text)];
  const view: View = Surfaces.Modal({
    title: title ?? 'Success',
    close: 'Close'
  })
    .blocks(blocks)
    .buildToObject();
  await client.views.update({
    view_id: viewId,
    view
  });
};

export const getMcpConnectionModal = (args: McpConnectionModalArgs): Block[] => {
  const { initialValues } = args;

  return BlockCollection([
    Section({
      text: 'Please provide your MCP server connection details:'
    }),
    Input({
      label: 'Name',
      blockId: 'mcp_name'
    }).element(
      Elements.TextInput({
        placeholder: 'e.g., My MCP Server',
        actionId: SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.NAME
      }).initialValue(initialValues?.name || '')
    ),
    Input({
      label: 'URL',
      blockId: 'mcp_url'
    }).element(
      Elements.TextInput({
        placeholder: 'e.g., https://mcp.example.com/sse',
        actionId: SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.URL
      }).initialValue(initialValues?.url || '')
    ),
    Input({
      label: 'API Token',
      blockId: 'mcp_api_token',
      hint: initialValues?.apiToken
        ? 'Current token is not displayed for security reasons. Enter a new token to update it.'
        : 'Your token is stored securely and cannot be accessed by anyone.'
    }).element(
      Elements.TextInput({
        placeholder: 'Used as a Bearer token in all requests to the MCP server.',
        actionId: SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.API_TOKEN
      })
    ),
    Input({
      label: 'Default Prompt',
      blockId: 'mcp_default_prompt',
      hint: 'Please provide a default prompt for MCP. This will be used when Quix communicates with your custom MCP server.'
    })
      .optional(true)
      .element(
        Elements.TextInput({
          placeholder: 'When sending data to the MCP server...',
          multiline: true,
          actionId: SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.DEFAULT_PROMPT,
          initialValue: args.initialValues?.defaultPrompt || ''
        })
      ),
    Input({
      label: 'When to invoke this server?',
      blockId: 'mcp_tool_selection_prompt',
      hint: 'This will help us determine when to invoke tools from this server.'
    }).element(
      Elements.TextInput({
        placeholder: `e.g. Use these tools when the user asks about the weather or when they want to know the news.`,
        multiline: true,
        actionId: SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.TOOL_SELECTION_PROMPT
      }).initialValue(initialValues?.toolSelectionPrompt || '')
    )
  ]);
};

/**
 * Publishes a modal to collect MCP server connection details
 */
export const publishMcpConnectionModal = async (
  client: WebClient,
  args: McpConnectionModalArgs
): Promise<void> => {
  try {
    const modal = getMcpConnectionModal(args);

    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'MCP Server Connection',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.MCP_CONNECTION_ACTIONS.SUBMIT
        }).buildToObject(),
        blocks: modal,
        private_metadata: JSON.stringify({
          id: args.initialValues?.id
        })
      }
    });
  } catch (error) {
    console.error('Error publishing MCP connection modal:', error);
    throw error;
  }
};

export const publishSalesforceConfigModal = async (
  client: WebClient,
  args: SalesforceConfigModalArgs
): Promise<void> => {
  try {
    const blocks = [
      Section({
        text: 'Customize the way Quix interacts with Salesforce'
      }),
      Input({
        label: 'Default Prompt',
        blockId: 'salesforce_default_prompt',
        hint: 'Please provide a default prompt for Salesforce. This will be used when Quix needs to interact with Salesforce.'
      })
        .optional(true)
        .element(
          Elements.TextInput({
            placeholder: `When creating Salesforce tasks...`,
            multiline: true,
            actionId: SLACK_ACTIONS.SALESFORCE_CONFIG_MODAL.DEFAULT_PROMPT
          }).initialValue(args.initialValues?.defaultPrompt || '')
        )
    ];

    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'Salesforce Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.SALESFORCE_CONFIG_MODAL.SUBMIT
        }).buildToObject(),
        blocks: BlockCollection(blocks)
      }
    });
  } catch (error) {
    console.error('Error publishing Salesforce connection modal:', error);
    throw error;
  }
};

export const publishHubspotConfigModal = async (
  client: WebClient,
  args: HubspotConfigModalArgs
): Promise<void> => {
  try {
    const blocks = [
      Section({
        text: 'Customize the way Quix interacts with Hubspot'
      }),
      Input({
        label: 'Default Prompt',
        blockId: 'hubspot_default_prompt',
        hint: 'Please provide a default prompt for Hubspot. This will be used when Quix needs to interact with Hubspot.'
      })
        .optional(true)
        .element(
          Elements.TextInput({
            placeholder: `When creating Hubspot tickets...`,
            multiline: true,
            actionId: SLACK_ACTIONS.HUBSPOT_CONFIG_MODAL.DEFAULT_PROMPT
          }).initialValue(args.initialValues?.defaultPrompt || '')
        )
    ];

    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'Hubspot Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.HUBSPOT_CONFIG_MODAL.SUBMIT
        }).buildToObject(),
        blocks: BlockCollection(blocks)
      }
    });
  } catch (error) {
    console.error('Error publishing Hubspot connection modal:', error);
    throw error;
  }
};

export const publishOktaConnectionModal = async (
  client: WebClient,
  args: OktaConnectionModalArgs
): Promise<void> => {
  try {
    const blocks = [
      Section({
        text: 'Please provide your Okta organization URL and API token:'
      }),
      Input({
        label: 'Organization URL',
        blockId: 'okta_org_url',
        hint: 'e.g., https://your-org.okta.com'
      }).element(
        Elements.TextInput({
          placeholder: 'https://your-org.okta.com',
          actionId: SLACK_ACTIONS.OKTA_CONNECTION_ACTIONS.ORG_URL,
          initialValue: args.initialValues?.orgUrl
        })
      ),
      Input({
        label: 'API Token',
        blockId: 'okta_token',
        hint: args.initialValues?.apiToken
          ? 'Current token is not displayed for security reasons. Enter a new token to update it.'
          : 'API token from your Okta admin console'
      }).element(
        Elements.TextInput({
          placeholder: args.initialValues?.apiToken ? 'Enter new token to update' : '00a...',
          actionId: SLACK_ACTIONS.OKTA_CONNECTION_ACTIONS.API_TOKEN
        })
      ),
      Section({
        text: 'The API token must have read and write permissions for Users, Groups, and Applications.'
      })
    ];
    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'Okta Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.SUBMIT_OKTA_CONNECTION
        }).buildToObject(),
        blocks: BlockCollection(blocks),
        private_metadata: JSON.stringify({
          id: args.initialValues?.id
        })
      }
    });
  } catch (error) {
    console.error('Error publishing Okta connection modal:', error);
    throw error;
  }
};

export const publishZendeskConnectionModal = async (
  client: WebClient,
  args: ZendeskConnectionModalArgs
): Promise<void> => {
  try {
    const blocks = [
      Section({ text: 'Please provide your Zendesk API token, email and subdomain:' }),

      Input({
        label: 'Subdomain',
        blockId: 'zendesk_subdomain',
        hint: 'Your Zendesk subdomain (e.g., `mycompany` for `mycompany.zendesk.com`)'
      }).element(
        Elements.TextInput({
          placeholder: 'mycompany',
          actionId: SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.SUBDOMAIN,
          initialValue: args.initialValues?.subdomain || ''
        })
      ),

      Input({
        label: 'Email',
        blockId: 'zendesk_email',
        hint: 'The Zendesk admin email to authenticate with your API token.'
      }).element(
        Elements.TextInput({
          placeholder: 'you@company.com',
          actionId: SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.EMAIL,
          initialValue: args.initialValues?.email || ''
        })
      ),

      Input({
        label: 'API Token',
        blockId: 'zendesk_token',
        hint: args.initialValues?.apiToken
          ? 'Current token is not displayed for security reasons. Enter a new token to update it.'
          : 'Generate a token from Zendesk Admin > API.'
      })
        .optional(!!args.initialValues?.apiToken)
        .element(
          Elements.TextInput({
            placeholder: 'ZENDESK_API_TOKEN',
            actionId: SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.API_TOKEN
          })
        ),

      Input({
        label: 'Default Prompt',
        blockId: 'zendesk_default_prompt',
        hint: 'Please provide a default prompt for Zendesk. This will be used when Quix interacts with Zendesk.'
      })
        .optional(true)
        .element(
          Elements.TextInput({
            placeholder: 'When creating Zendesk tickets...',
            multiline: true,
            actionId: SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.DEFAULT_PROMPT,
            initialValue: args.initialValues?.defaultPrompt || ''
          })
        )
    ];

    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'Zendesk Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.ZENDESK_CONNECTION_ACTIONS.SUBMIT
        }).buildToObject(),
        blocks: BlockCollection(blocks)
      }
    });
  } catch (error) {
    console.error('Error publishing Zendesk connection modal:', error);
    throw error;
  }
};

export const publishJumpCloudConnectionModal = async (
  client: WebClient,
  args: JumpCloudConnectionModalArgs
): Promise<void> => {
  try {
    const blocks = [
      Section({
        text: 'Please provide your JumpCloud API key:'
      }),
      Input({
        label: 'API Key',
        blockId: 'jumpcloud_api_key',
        hint: 'API key from your JumpCloud admin console'
      }).element(
        Elements.TextInput({
          placeholder: 'jca_',
          actionId: SLACK_ACTIONS.JUMPCLOUD_CONNECTION_ACTIONS.API_KEY,
          initialValue: args.initialValues?.apiKey
        })
      ),
      Section({
        text: 'The API key must have read and write permissions for Users and Groups.'
      })
    ];
    await client.views.open({
      trigger_id: args.triggerId,
      view: {
        ...Surfaces.Modal({
          title: 'JumpCloud Configuration',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.SUBMIT_JUMPCLOUD_CONNECTION
        }).buildToObject(),
        blocks: BlockCollection(blocks),
        private_metadata: JSON.stringify({
          id: args.initialValues?.id
        })
      }
    });
  } catch (error) {
    console.error('Error publishing JumpCloud connection modal:', error);
    throw error;
  }
};

export const publishDisconnectConfirmationModal = async (
  client: WebClient,
  args: {
    triggerId: string;
    connectionName: string;
    connectionInfoPayload: ConnectionInfo;
  }
): Promise<void> => {
  await client.views.open({
    trigger_id: args.triggerId,
    view: {
      ...Surfaces.Modal({
        title: `Disconnect ${args.connectionName}?`,
        submit: 'Yes, disconnect',
        close: 'Cancel',
        callbackId: SLACK_ACTIONS.DISCONNECT_CONFIRM_MODAL.SUBMIT
      }).buildToObject(),
      private_metadata: JSON.stringify(args.connectionInfoPayload),
      blocks: BlockCollection([
        Section({ text: `Are you sure you want to disconnect ${Md.bold(args.connectionName)}?` })
      ])
    }
  });
};
