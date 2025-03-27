import { Elements, BlockCollection } from "slack-block-builder";
import { SLACK_ACTIONS } from "@quix/lib/utils/slack-constants";
import { Block } from "@slack/web-api";
import { Bits, Section, Input } from "slack-block-builder";
import { JiraDefaultConfigModalArgs, PostgresConnectionModalArgs } from "./types";
import { WebClient } from "@slack/web-api";
import { Surfaces } from "slack-block-builder";
import { QuixUserAccessLevel } from "@quix/lib/constants";

export const getPostgresConnectionModal = (args: PostgresConnectionModalArgs): Block[] => {
  const { initialValues } = args;

  return BlockCollection([
    Section({
      text: 'Please provide your PostgreSQL connection details:'
    }),
    Input({
      label: 'Host',
      blockId: 'postgres_host',
    }).element(Elements.TextInput({
      placeholder: 'e.g., localhost or db.example.com',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.HOST
    }).initialValue(initialValues?.host || '')),
    Input({
      label: 'Port',
      blockId: 'postgres_port',
    }).element(Elements.TextInput({
      placeholder: 'e.g., 5432',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PORT
    }).initialValue(initialValues?.port || '5432')),
    Input({
      label: 'Database',
      blockId: 'postgres_database',
    }).element(Elements.TextInput({
      placeholder: 'e.g., mydb',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.DATABASE
    }).initialValue(initialValues?.database || '')),
    Input({
      label: 'Username',
      blockId: 'postgres_username',
    }).element(Elements.TextInput({
      placeholder: 'e.g., postgres',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.USER
    }).initialValue(initialValues?.username || '')),
    Input({
      label: 'Password',
      blockId: 'postgres_password',
    }).element(Elements.TextInput({
      placeholder: 'Your database password',
      actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.PASSWORD
    }).initialValue(initialValues?.password || '')),
    Input({
      label: 'SSL',
      blockId: 'postgres_ssl',
    }).element(
      Elements.Checkboxes({
        actionId: SLACK_ACTIONS.POSTGRES_CONNECTION_ACTIONS.SSL
      })
        .initialOptions(
          initialValues?.ssl ? [Bits.Option({
            text: 'Use SSL connection',
            value: 'ssl'
          })] : []
        ).options([
          Bits.Option({
            text: 'Use SSL connection',
            value: 'ssl'
          })
        ])
    ).optional(true),
    Section({
      text: 'Your credentials are securely stored and only used to connect to your database.'
    })
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
          title: 'PostgreSQL Connection',
          submit: 'Submit',
          close: 'Cancel',
          callbackId: SLACK_ACTIONS.SUBMIT_POSTGRES_CONNECTION
        }).buildToObject(),
        blocks: modal,
        private_metadata: JSON.stringify({
          id: args.initialValues?.id
        })
      }
    });
  } catch (error) {
    console.error("Error publishing PostgreSQL connection modal:", error);
    throw error;
  }
};

export const publishOpenaiKeyModal = async (
  client: WebClient,
  args: {
    triggerId: string,
    teamId: string
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
          blockId: 'openai_api_key',
        }).element(Elements.TextInput({
          placeholder: 'sk-...',
          actionId: SLACK_ACTIONS.OPENAI_API_KEY_MODAL.OPENAI_API_KEY_INPUT
        }))
      ])
    }
  });
};

export const publishManageAdminsModal = async (
  client: WebClient,
  args: {
    triggerId: string,
    teamId: string,
    initialUsers?: string[]
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
          blockId: 'admin_user_ids',
        }).element(Elements.ConversationMultiSelect({
          placeholder: 'e.g., @john.doe, @jane.doe',
          actionId: SLACK_ACTIONS.MANAGE_ADMINS_INPUT,
        })
          .filter('im')
          .excludeBotUsers(true)
          .excludeExternalSharedChannels(true)
          .maxSelectedItems(10)
          .initialConversations(args.initialUsers || []))
      ])
    }
  });
};

export const publishJiraConfigModal = async (
  client: WebClient,
  args: JiraDefaultConfigModalArgs
): Promise<void> => {
  const { triggerId, initialValues } = args;

  await client.views.open({
    trigger_id: triggerId,
    view: {
      ...Surfaces.Modal({
        title: 'Jira Config',
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
          blockId: 'project-key',
        }).element(Elements.TextInput({
          placeholder: 'e.g., PROJ',
          actionId: SLACK_ACTIONS.JIRA_CONFIG_MODAL.PROJECT_KEY_INPUT,
          initialValue: initialValues?.projectKey || '',
        })),
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
        callbackId: SLACK_ACTIONS.MANAGE_ACCESS_CONTROLS,
      }).buildToObject(),
      blocks: BlockCollection([
        // Channel selection
        Section({
          text: 'Select channels where Quix is allowed to respond(If no channel is selected it is allowed to respond in all the channels):',
        }),
        Input({
          label: 'Allowed Channels',
          blockId: 'allowed_channel_ids',
        }).optional(true).element(
          Elements.ConversationMultiSelect({
            actionId: SLACK_ACTIONS.ALLOWED_CHANNELS_SELECT,
            placeholder: 'Select channels',
          })
            .filter('public')
            .excludeBotUsers(true)
            .initialConversations(args.initialChannels || [])
        ),

        // Access Level selection
        Input({
          label: 'Who can interact with Quix in DM?',
          blockId: 'access_level',
        }).optional(true).element(
          Elements.StaticSelect({
            actionId: SLACK_ACTIONS.ACCESS_LEVEL_SELECT,
            placeholder: 'Select access level',
          })
            .options([
              Bits.Option({
                text: 'Everyone',
                value: QuixUserAccessLevel.EVERYONE,
              }),
              Bits.Option({
                text: 'Admins Only',
                value: QuixUserAccessLevel.ADMINS_ONLY,
              }),
            ])
            .initialOption(args.initialAccessLevel
              ? Bits.Option({
                text: args.initialAccessLevel === QuixUserAccessLevel.EVERYONE ? 'Everyone' : 'Admins Only',
                value: args.initialAccessLevel,
              })
              : undefined)
        ),
      ]),
    },
  });
};
