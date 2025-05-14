{
  result: {
    messages: [
      HumanMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '&gt; Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
            '@Quix File a Jira issue for this in the TEST project',
          additional_kwargs: {},
          response_metadata: {},
          id: 'd111eaa4-8231-4ac1-bcc1-f0ae896e5893'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '&gt; Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
          '@Quix File a Jira issue for this in the TEST project',
        name: undefined,
        additional_kwargs: {},
        response_metadata: {},
        id: 'd111eaa4-8231-4ac1-bcc1-f0ae896e5893'
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '',
          name: undefined,
          additional_kwargs: {
            function_call: undefined,
            tool_calls: [
              {
                id: 'call_yR5HvIxQbLNOGOSOPEcWoJ2s',
                type: 'function',
                function: {
                  name: 'get_jira_issue_types',
                  arguments: '{"projectKey":"TEST"}'
                }
              }
            ]
          },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 1065,
              completion_tokens: 19,
              total_tokens: 1084,
              prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_f5bdcc3276'
          },
          id: 'chatcmpl-BX86X7cPkUNNvtWenzkrRNqUgkm7L',
          tool_calls: [
            {
              name: 'get_jira_issue_types',
              args: { projectKey: 'TEST' },
              type: 'tool_call',
              id: 'call_yR5HvIxQbLNOGOSOPEcWoJ2s'
            }
          ],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 19,
            input_tokens: 1065,
            total_tokens: 1084,
            input_token_details: { audio: 0, cache_read: 0 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '',
        name: undefined,
        additional_kwargs: {
          function_call: undefined,
          tool_calls: [
            {
              id: 'call_yR5HvIxQbLNOGOSOPEcWoJ2s',
              type: 'function',
              function: {
                name: 'get_jira_issue_types',
                arguments: '{"projectKey":"TEST"}'
              }
            }
          ]
        },
        response_metadata: {
          tokenUsage: {
            promptTokens: 1065,
            completionTokens: 19,
            totalTokens: 1084
          },
          finish_reason: 'tool_calls',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 1065,
            completion_tokens: 19,
            total_tokens: 1084,
            prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_f5bdcc3276'
        },
        id: 'chatcmpl-BX86X7cPkUNNvtWenzkrRNqUgkm7L',
        tool_calls: [
          {
            name: 'get_jira_issue_types',
            args: { projectKey: 'TEST' },
            type: 'tool_call',
            id: 'call_yR5HvIxQbLNOGOSOPEcWoJ2s'
          }
        ],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 19,
          input_tokens: 1065,
          total_tokens: 1084,
          input_token_details: { audio: 0, cache_read: 0 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      },
      ToolMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '{\n' +
            '  "success": true,\n' +
            '  "data": {\n' +
            '    "issueTypes": {\n' +
            '      "startAt": 0,\n' +
            '      "maxResults": 50,\n' +
            '      "total": 3,\n' +
            '      "issueTypes": [\n' +
            '        {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10075",\n' +
            '          "id": "10075",\n' +
            '          "description": "Request received from your email support channel.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10716?size=medium",\n' +
            '          "name": "Email request",\n' +
            '          "untranslatedName": "Email request",\n' +
            '          "subtask": false,\n' +
            '          "hierarchyLevel": 0,\n' +
            '          "scope": {\n' +
            '            "type": "PROJECT",\n' +
            '            "project": {\n' +
            '              "id": "10069"\n' +
            '            }\n' +
            '          }\n' +
            '        },\n' +
            '        {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
            '          "id": "10076",\n' +
            '          "description": "Submit a request or report a problem.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
            '          "name": "Submit a request or incident",\n' +
            '          "untranslatedName": "Submit a request or incident",\n' +
            '          "subtask": false,\n' +
            '          "hierarchyLevel": 0,\n' +
            '          "scope": {\n' +
            '            "type": "PROJECT",\n' +
            '            "project": {\n' +
            '              "id": "10069"\n' +
            '            }\n' +
            '          }\n' +
            '        },\n' +
            '        {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10077",\n' +
            '          "id": "10077",\n' +
            '          "description": "Have a question? Submit it here.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10320?size=medium",\n' +
            '          "name": "Ask a question",\n' +
            '          "untranslatedName": "Ask a question",\n' +
            '          "subtask": false,\n' +
            '          "hierarchyLevel": 0,\n' +
            '          "scope": {\n' +
            '            "type": "PROJECT",\n' +
            '            "project": {\n' +
            '              "id": "10069"\n' +
            '            }\n' +
            '          }\n' +
            '        }\n' +
            '      ]\n' +
            '    }\n' +
            '  }\n' +
            '}',
          artifact: undefined,
          tool_call_id: 'call_yR5HvIxQbLNOGOSOPEcWoJ2s',
          name: 'get_jira_issue_types',
          additional_kwargs: {},
          response_metadata: {},
          id: '94e081c4-5744-4562-90bc-aaffa1aeb2e1'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '{\n' +
          '  "success": true,\n' +
          '  "data": {\n' +
          '    "issueTypes": {\n' +
          '      "startAt": 0,\n' +
          '      "maxResults": 50,\n' +
          '      "total": 3,\n' +
          '      "issueTypes": [\n' +
          '        {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10075",\n' +
          '          "id": "10075",\n' +
          '          "description": "Request received from your email support channel.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10716?size=medium",\n' +
          '          "name": "Email request",\n' +
          '          "untranslatedName": "Email request",\n' +
          '          "subtask": false,\n' +
          '          "hierarchyLevel": 0,\n' +
          '          "scope": {\n' +
          '            "type": "PROJECT",\n' +
          '            "project": {\n' +
          '              "id": "10069"\n' +
          '            }\n' +
          '          }\n' +
          '        },\n' +
          '        {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
          '          "id": "10076",\n' +
          '          "description": "Submit a request or report a problem.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
          '          "name": "Submit a request or incident",\n' +
          '          "untranslatedName": "Submit a request or incident",\n' +
          '          "subtask": false,\n' +
          '          "hierarchyLevel": 0,\n' +
          '          "scope": {\n' +
          '            "type": "PROJECT",\n' +
          '            "project": {\n' +
          '              "id": "10069"\n' +
          '            }\n' +
          '          }\n' +
          '        },\n' +
          '        {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10077",\n' +
          '          "id": "10077",\n' +
          '          "description": "Have a question? Submit it here.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10320?size=medium",\n' +
          '          "name": "Ask a question",\n' +
          '          "untranslatedName": "Ask a question",\n' +
          '          "subtask": false,\n' +
          '          "hierarchyLevel": 0,\n' +
          '          "scope": {\n' +
          '            "type": "PROJECT",\n' +
          '            "project": {\n' +
          '              "id": "10069"\n' +
          '            }\n' +
          '          }\n' +
          '        }\n' +
          '      ]\n' +
          '    }\n' +
          '  }\n' +
          '}',
        name: 'get_jira_issue_types',
        additional_kwargs: {},
        response_metadata: {},
        id: '94e081c4-5744-4562-90bc-aaffa1aeb2e1',
        lc_direct_tool_output: true,
        status: undefined,
        tool_call_id: 'call_yR5HvIxQbLNOGOSOPEcWoJ2s',
        artifact: undefined
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '',
          name: undefined,
          additional_kwargs: {
            function_call: undefined,
            tool_calls: [
              {
                id: 'call_q2JJBCxgz2OtgaRkVbxPXZ3u',
                type: 'function',
                function: {
                  name: 'create_jira_issue',
                  arguments: '{"projectKey":"TEST","summary":"Website experiencing slow loading times","description":"Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.","issueTypeId":"10076","priority":"Medium","assigneeId":"","labels":[]}'
                }
              }
            ]
          },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 1765,
              completion_tokens: 156,
              total_tokens: 1921,
              prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_f5bdcc3276'
          },
          id: 'chatcmpl-BX86Zrw619UHqoWgoxNxIcILI7Rsa',
          tool_calls: [
            {
              name: 'create_jira_issue',
              args: {
                projectKey: 'TEST',
                summary: 'Website experiencing slow loading times',
                description: 'Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.',
                issueTypeId: '10076',
                priority: 'Medium',
                assigneeId: '',
                labels: []
              },
              type: 'tool_call',
              id: 'call_q2JJBCxgz2OtgaRkVbxPXZ3u'
            }
          ],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 156,
            input_tokens: 1765,
            total_tokens: 1921,
            input_token_details: { audio: 0, cache_read: 0 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '',
        name: undefined,
        additional_kwargs: {
          function_call: undefined,
          tool_calls: [
            {
              id: 'call_q2JJBCxgz2OtgaRkVbxPXZ3u',
              type: 'function',
              function: {
                name: 'create_jira_issue',
                arguments: '{"projectKey":"TEST","summary":"Website experiencing slow loading times","description":"Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.","issueTypeId":"10076","priority":"Medium","assigneeId":"","labels":[]}'
              }
            }
          ]
        },
        response_metadata: {
          tokenUsage: {
            promptTokens: 1765,
            completionTokens: 156,
            totalTokens: 1921
          },
          finish_reason: 'tool_calls',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 1765,
            completion_tokens: 156,
            total_tokens: 1921,
            prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_f5bdcc3276'
        },
        id: 'chatcmpl-BX86Zrw619UHqoWgoxNxIcILI7Rsa',
        tool_calls: [
          {
            name: 'create_jira_issue',
            args: {
              projectKey: 'TEST',
              summary: 'Website experiencing slow loading times',
              description: 'Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.',
              issueTypeId: '10076',
              priority: 'Medium',
              assigneeId: '',
              labels: []
            },
            type: 'tool_call',
            id: 'call_q2JJBCxgz2OtgaRkVbxPXZ3u'
          }
        ],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 156,
          input_tokens: 1765,
          total_tokens: 1921,
          input_token_details: { audio: 0, cache_read: 0 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      },
      ToolMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '{\n' +
            '  "success": true,\n' +
            '  "data": {\n' +
            '    "issue": {\n' +
            '      "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",\n' +
            '      "id": "10821",\n' +
            '      "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10821",\n' +
            '      "key": "TEST-29",\n' +
            '      "fields": {\n' +
            '        "statuscategorychangedate": "2025-05-14T20:44:45.566+0530",\n' +
            '        "issuetype": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
            '          "id": "10076",\n' +
            '          "description": "Submit a request or report a problem.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
            '          "name": "Submit a request or incident",\n' +
            '          "subtask": false,\n' +
            '          "avatarId": 10306,\n' +
            '          "entityId": "9e9ecd6e-8b6a-4a11-a47c-1467ed0de848",\n' +
            '          "hierarchyLevel": 0\n' +
            '        },\n' +
            '        "components": [],\n' +
            '        "timespent": null,\n' +
            '        "timeoriginalestimate": null,\n' +
            '        "project": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/project/10069",\n' +
            '          "id": "10069",\n' +
            '          "key": "TEST",\n' +
            '          "name": "test jsm",\n' +
            '          "projectTypeKey": "service_desk",\n' +
            '          "simplified": true,\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406",\n' +
            '            "24x24": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=small",\n' +
            '            "16x16": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=xsmall",\n' +
            '            "32x32": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=medium"\n' +
            '          }\n' +
            '        },\n' +
            '        "customfield_10097": null,\n' +
            '        "description": {\n' +
            '          "type": "doc",\n' +
            '          "version": 1,\n' +
            '          "content": [\n' +
            '            {\n' +
            '              "type": "paragraph",\n' +
            '              "content": [\n' +
            '                {\n' +
            '                  "type": "text",\n' +
            '                  "text": "Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience."\n' +
            '                }\n' +
            '              ]\n' +
            '            }\n' +
            '          ]\n' +
            '        },\n' +
            '        "fixVersions": [],\n' +
            '        "aggregatetimespent": null,\n' +
            '        "customfield_10034": [],\n' +
            '        "statusCategory": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
            '          "id": 2,\n' +
            '          "key": "new",\n' +
            '          "colorName": "blue-gray",\n' +
            '          "name": "To Do"\n' +
            '        },\n' +
            '        "customfield_10035": null,\n' +
            '        "resolution": null,\n' +
            '        "customfield_10036": null,\n' +
            '        "timetracking": {},\n' +
            '        "customfield_10049": null,\n' +
            '        "security": null,\n' +
            '        "attachment": [],\n' +
            '        "aggregatetimeestimate": null,\n' +
            '        "resolutiondate": null,\n' +
            '        "workratio": -1,\n' +
            '        "summary": "Website experiencing slow loading times",\n' +
            '        "watches": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-29/watchers",\n' +
            '          "watchCount": 1,\n' +
            '          "isWatching": true\n' +
            '        },\n' +
            '        "lastViewed": null,\n' +
            '        "creator": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
            '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
            '          "emailAddress": "engineering@clearfeed.ai",\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
            '          },\n' +
            '          "displayName": "ClearFeed Engineering",\n' +
            '          "active": true,\n' +
            '          "timeZone": "Asia/Calcutta",\n' +
            '          "accountType": "atlassian"\n' +
            '        },\n' +
            '        "subtasks": [],\n' +
            '        "created": "2025-05-14T20:44:45.047+0530",\n' +
            '        "reporter": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
            '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
            '          "emailAddress": "engineering@clearfeed.ai",\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
            '          },\n' +
            '          "displayName": "ClearFeed Engineering",\n' +
            '          "active": true,\n' +
            '          "timeZone": "Asia/Calcutta",\n' +
            '          "accountType": "atlassian"\n' +
            '        },\n' +
            '        "aggregateprogress": {\n' +
            '          "progress": 0,\n' +
            '          "total": 0\n' +
            '        },\n' +
            '        "priority": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/priority/3",\n' +
            '          "iconUrl": "https://clearfeed-testing.atlassian.net/images/icons/priorities/medium_new.svg",\n' +
            '          "name": "Medium",\n' +
            '          "id": "3"\n' +
            '        },\n' +
            '        "customfield_10002": [],\n' +
            '        "labels": [],\n' +
            '        "environment": null,\n' +
            '        "timeestimate": null,\n' +
            '        "aggregatetimeoriginalestimate": null,\n' +
            '        "versions": [],\n' +
            '        "duedate": null,\n' +
            '        "progress": {\n' +
            '          "progress": 0,\n' +
            '          "total": 0\n' +
            '        },\n' +
            '        "issuelinks": [],\n' +
            '        "votes": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-29/votes",\n' +
            '          "votes": 0,\n' +
            '          "hasVoted": false\n' +
            '        },\n' +
            '        "comment": {\n' +
            '          "comments": [],\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10821/comment",\n' +
            '          "maxResults": 0,\n' +
            '          "total": 0,\n' +
            '          "startAt": 0\n' +
            '        },\n' +
            '        "assignee": null,\n' +
            '        "worklog": {\n' +
            '          "startAt": 0,\n' +
            '          "maxResults": 20,\n' +
            '          "total": 0,\n' +
            '          "worklogs": []\n' +
            '        },\n' +
            '        "updated": "2025-05-14T20:44:45.186+0530",\n' +
            '        "status": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/status/10051",\n' +
            '          "description": "",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/",\n' +
            '          "name": "To Do",\n' +
            '          "id": "10051",\n' +
            '          "statusCategory": {\n' +
            '            "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
            '            "id": 2,\n' +
            '            "key": "new",\n' +
            '            "colorName": "blue-gray",\n' +
            '            "name": "To Do"\n' +
            '          }\n' +
            '        }\n' +
            '      },\n' +
            '      "url": "https://clearfeed-testing.atlassian.net/browse/TEST-29"\n' +
            '    }\n' +
            '  }\n' +
            '}',
          artifact: undefined,
          tool_call_id: 'call_q2JJBCxgz2OtgaRkVbxPXZ3u',
          name: 'create_jira_issue',
          additional_kwargs: {},
          response_metadata: {},
          id: '32417e6e-9871-4c97-8867-88fc30a761d4'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '{\n' +
          '  "success": true,\n' +
          '  "data": {\n' +
          '    "issue": {\n' +
          '      "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",\n' +
          '      "id": "10821",\n' +
          '      "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10821",\n' +
          '      "key": "TEST-29",\n' +
          '      "fields": {\n' +
          '        "statuscategorychangedate": "2025-05-14T20:44:45.566+0530",\n' +
          '        "issuetype": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
          '          "id": "10076",\n' +
          '          "description": "Submit a request or report a problem.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
          '          "name": "Submit a request or incident",\n' +
          '          "subtask": false,\n' +
          '          "avatarId": 10306,\n' +
          '          "entityId": "9e9ecd6e-8b6a-4a11-a47c-1467ed0de848",\n' +
          '          "hierarchyLevel": 0\n' +
          '        },\n' +
          '        "components": [],\n' +
          '        "timespent": null,\n' +
          '        "timeoriginalestimate": null,\n' +
          '        "project": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/project/10069",\n' +
          '          "id": "10069",\n' +
          '          "key": "TEST",\n' +
          '          "name": "test jsm",\n' +
          '          "projectTypeKey": "service_desk",\n' +
          '          "simplified": true,\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406",\n' +
          '            "24x24": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=small",\n' +
          '            "16x16": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=xsmall",\n' +
          '            "32x32": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=medium"\n' +
          '          }\n' +
          '        },\n' +
          '        "customfield_10097": null,\n' +
          '        "description": {\n' +
          '          "type": "doc",\n' +
          '          "version": 1,\n' +
          '          "content": [\n' +
          '            {\n' +
          '              "type": "paragraph",\n' +
          '              "content": [\n' +
          '                {\n' +
          '                  "type": "text",\n' +
          '                  "text": "Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience."\n' +
          '                }\n' +
          '              ]\n' +
          '            }\n' +
          '          ]\n' +
          '        },\n' +
          '        "fixVersions": [],\n' +
          '        "aggregatetimespent": null,\n' +
          '        "customfield_10034": [],\n' +
          '        "statusCategory": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
          '          "id": 2,\n' +
          '          "key": "new",\n' +
          '          "colorName": "blue-gray",\n' +
          '          "name": "To Do"\n' +
          '        },\n' +
          '        "customfield_10035": null,\n' +
          '        "resolution": null,\n' +
          '        "customfield_10036": null,\n' +
          '        "timetracking": {},\n' +
          '        "customfield_10049": null,\n' +
          '        "security": null,\n' +
          '        "attachment": [],\n' +
          '        "aggregatetimeestimate": null,\n' +
          '        "resolutiondate": null,\n' +
          '        "workratio": -1,\n' +
          '        "summary": "Website experiencing slow loading times",\n' +
          '        "watches": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-29/watchers",\n' +
          '          "watchCount": 1,\n' +
          '          "isWatching": true\n' +
          '        },\n' +
          '        "lastViewed": null,\n' +
          '        "creator": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
          '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
          '          "emailAddress": "engineering@clearfeed.ai",\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
          '          },\n' +
          '          "displayName": "ClearFeed Engineering",\n' +
          '          "active": true,\n' +
          '          "timeZone": "Asia/Calcutta",\n' +
          '          "accountType": "atlassian"\n' +
          '        },\n' +
          '        "subtasks": [],\n' +
          '        "created": "2025-05-14T20:44:45.047+0530",\n' +
          '        "reporter": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
          '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
          '          "emailAddress": "engineering@clearfeed.ai",\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
          '          },\n' +
          '          "displayName": "ClearFeed Engineering",\n' +
          '          "active": true,\n' +
          '          "timeZone": "Asia/Calcutta",\n' +
          '          "accountType": "atlassian"\n' +
          '        },\n' +
          '        "aggregateprogress": {\n' +
          '          "progress": 0,\n' +
          '          "total": 0\n' +
          '        },\n' +
          '        "priority": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/priority/3",\n' +
          '          "iconUrl": "https://clearfeed-testing.atlassian.net/images/icons/priorities/medium_new.svg",\n' +
          '          "name": "Medium",\n' +
          '          "id": "3"\n' +
          '        },\n' +
          '        "customfield_10002": [],\n' +
          '        "labels": [],\n' +
          '        "environment": null,\n' +
          '        "timeestimate": null,\n' +
          '        "aggregatetimeoriginalestimate": null,\n' +
          '        "versions": [],\n' +
          '        "duedate": null,\n' +
          '        "progress": {\n' +
          '          "progress": 0,\n' +
          '          "total": 0\n' +
          '        },\n' +
          '        "issuelinks": [],\n' +
          '        "votes": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-29/votes",\n' +
          '          "votes": 0,\n' +
          '          "hasVoted": false\n' +
          '        },\n' +
          '        "comment": {\n' +
          '          "comments": [],\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10821/comment",\n' +
          '          "maxResults": 0,\n' +
          '          "total": 0,\n' +
          '          "startAt": 0\n' +
          '        },\n' +
          '        "assignee": null,\n' +
          '        "worklog": {\n' +
          '          "startAt": 0,\n' +
          '          "maxResults": 20,\n' +
          '          "total": 0,\n' +
          '          "worklogs": []\n' +
          '        },\n' +
          '        "updated": "2025-05-14T20:44:45.186+0530",\n' +
          '        "status": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/status/10051",\n' +
          '          "description": "",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/",\n' +
          '          "name": "To Do",\n' +
          '          "id": "10051",\n' +
          '          "statusCategory": {\n' +
          '            "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
          '            "id": 2,\n' +
          '            "key": "new",\n' +
          '            "colorName": "blue-gray",\n' +
          '            "name": "To Do"\n' +
          '          }\n' +
          '        }\n' +
          '      },\n' +
          '      "url": "https://clearfeed-testing.atlassian.net/browse/TEST-29"\n' +
          '    }\n' +
          '  }\n' +
          '}',
        name: 'create_jira_issue',
        additional_kwargs: {},
        response_metadata: {},
        id: '32417e6e-9871-4c97-8867-88fc30a761d4',
        lc_direct_tool_output: true,
        status: undefined,
        tool_call_id: 'call_q2JJBCxgz2OtgaRkVbxPXZ3u',
        artifact: undefined
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: 'The Jira issue has been successfully created in the TEST project. Here are the details:\n' +
            '\n' +
            '- **Summary**: Website experiencing slow loading times\n' +
            '- **Description**: Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
            '- **Priority**: Medium\n' +
            '- **Issue Type**: Submit a request or incident\n' +
            '\n' +
            'You can view the issue [here](https://clearfeed-testing.atlassian.net/browse/TEST-29).',
          name: undefined,
          additional_kwargs: { function_call: undefined, tool_calls: undefined },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 4713,
              completion_tokens: 188,
              total_tokens: 4901,
              prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_d8864f8b6b'
          },
          id: 'chatcmpl-BX86h7DVCVnAssnpeZw2NWVeIfW4D',
          tool_calls: [],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 188,
            input_tokens: 4713,
            total_tokens: 4901,
            input_token_details: { audio: 0, cache_read: 0 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: 'The Jira issue has been successfully created in the TEST project. Here are the details:\n' +
          '\n' +
          '- **Summary**: Website experiencing slow loading times\n' +
          '- **Description**: Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
          '- **Priority**: Medium\n' +
          '- **Issue Type**: Submit a request or incident\n' +
          '\n' +
          'You can view the issue [here](https://clearfeed-testing.atlassian.net/browse/TEST-29).',
        name: undefined,
        additional_kwargs: { function_call: undefined, tool_calls: undefined },
        response_metadata: {
          tokenUsage: {
            promptTokens: 4713,
            completionTokens: 188,
            totalTokens: 4901
          },
          finish_reason: 'stop',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 4713,
            completion_tokens: 188,
            total_tokens: 4901,
            prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_d8864f8b6b'
        },
        id: 'chatcmpl-BX86h7DVCVnAssnpeZw2NWVeIfW4D',
        tool_calls: [],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 188,
          input_tokens: 4713,
          total_tokens: 4901,
          input_token_details: { audio: 0, cache_read: 0 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      }
    ]
  }
}




{
  result: {
    messages: [
      HumanMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '&gt; Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
            '@Quix File a Jira issue for this in the TEST project',
          additional_kwargs: {},
          response_metadata: {},
          id: 'ad4bbeb3-db7b-4e1b-b3b1-a7756bf9402c'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '&gt; Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
          '@Quix File a Jira issue for this in the TEST project',
        name: undefined,
        additional_kwargs: {},
        response_metadata: {},
        id: 'ad4bbeb3-db7b-4e1b-b3b1-a7756bf9402c'
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '',
          name: undefined,
          additional_kwargs: {
            function_call: undefined,
            tool_calls: [
              {
                id: 'call_CVtKvCBgA3k8zLkqjX0DvSMu',
                type: 'function',
                function: {
                  name: 'get_jira_issue_types',
                  arguments: '{"projectKey":"TEST"}'
                }
              }
            ]
          },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 1008,
              completion_tokens: 19,
              total_tokens: 1027,
              prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_55d88aaf2f'
          },
          id: 'chatcmpl-BX7uANf5eNoAgPMTollc0aWU0Ixyw',
          tool_calls: [
            {
              name: 'get_jira_issue_types',
              args: { projectKey: 'TEST' },
              type: 'tool_call',
              id: 'call_CVtKvCBgA3k8zLkqjX0DvSMu'
            }
          ],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 19,
            input_tokens: 1008,
            total_tokens: 1027,
            input_token_details: { audio: 0, cache_read: 0 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '',
        name: undefined,
        additional_kwargs: {
          function_call: undefined,
          tool_calls: [
            {
              id: 'call_CVtKvCBgA3k8zLkqjX0DvSMu',
              type: 'function',
              function: {
                name: 'get_jira_issue_types',
                arguments: '{"projectKey":"TEST"}'
              }
            }
          ]
        },
        response_metadata: {
          tokenUsage: {
            promptTokens: 1008,
            completionTokens: 19,
            totalTokens: 1027
          },
          finish_reason: 'tool_calls',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 1008,
            completion_tokens: 19,
            total_tokens: 1027,
            prompt_tokens_details: { cached_tokens: 0, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_55d88aaf2f'
        },
        id: 'chatcmpl-BX7uANf5eNoAgPMTollc0aWU0Ixyw',
        tool_calls: [
          {
            name: 'get_jira_issue_types',
            args: { projectKey: 'TEST' },
            type: 'tool_call',
            id: 'call_CVtKvCBgA3k8zLkqjX0DvSMu'
          }
        ],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 19,
          input_tokens: 1008,
          total_tokens: 1027,
          input_token_details: { audio: 0, cache_read: 0 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      },
      ToolMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '{\n' +
            '  "success": true,\n' +
            '  "data": {\n' +
            '    "issueTypes": {\n' +
            '      "startAt": 0,\n' +
            '      "maxResults": 50,\n' +
            '      "total": 3,\n' +
            '      "issueTypes": [\n' +
            '        {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10075",\n' +
            '          "id": "10075",\n' +
            '          "description": "Request received from your email support channel.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10716?size=medium",\n' +
            '          "name": "Email request",\n' +
            '          "untranslatedName": "Email request",\n' +
            '          "subtask": false,\n' +
            '          "hierarchyLevel": 0,\n' +
            '          "scope": {\n' +
            '            "type": "PROJECT",\n' +
            '            "project": {\n' +
            '              "id": "10069"\n' +
            '            }\n' +
            '          }\n' +
            '        },\n' +
            '        {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
            '          "id": "10076",\n' +
            '          "description": "Submit a request or report a problem.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
            '          "name": "Submit a request or incident",\n' +
            '          "untranslatedName": "Submit a request or incident",\n' +
            '          "subtask": false,\n' +
            '          "hierarchyLevel": 0,\n' +
            '          "scope": {\n' +
            '            "type": "PROJECT",\n' +
            '            "project": {\n' +
            '              "id": "10069"\n' +
            '            }\n' +
            '          }\n' +
            '        },\n' +
            '        {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10077",\n' +
            '          "id": "10077",\n' +
            '          "description": "Have a question? Submit it here.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10320?size=medium",\n' +
            '          "name": "Ask a question",\n' +
            '          "untranslatedName": "Ask a question",\n' +
            '          "subtask": false,\n' +
            '          "hierarchyLevel": 0,\n' +
            '          "scope": {\n' +
            '            "type": "PROJECT",\n' +
            '            "project": {\n' +
            '              "id": "10069"\n' +
            '            }\n' +
            '          }\n' +
            '        }\n' +
            '      ]\n' +
            '    }\n' +
            '  }\n' +
            '}',
          artifact: undefined,
          tool_call_id: 'call_CVtKvCBgA3k8zLkqjX0DvSMu',
          name: 'get_jira_issue_types',
          additional_kwargs: {},
          response_metadata: {},
          id: 'a8439cc2-176f-421a-92b3-f54506636231'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '{\n' +
          '  "success": true,\n' +
          '  "data": {\n' +
          '    "issueTypes": {\n' +
          '      "startAt": 0,\n' +
          '      "maxResults": 50,\n' +
          '      "total": 3,\n' +
          '      "issueTypes": [\n' +
          '        {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10075",\n' +
          '          "id": "10075",\n' +
          '          "description": "Request received from your email support channel.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10716?size=medium",\n' +
          '          "name": "Email request",\n' +
          '          "untranslatedName": "Email request",\n' +
          '          "subtask": false,\n' +
          '          "hierarchyLevel": 0,\n' +
          '          "scope": {\n' +
          '            "type": "PROJECT",\n' +
          '            "project": {\n' +
          '              "id": "10069"\n' +
          '            }\n' +
          '          }\n' +
          '        },\n' +
          '        {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
          '          "id": "10076",\n' +
          '          "description": "Submit a request or report a problem.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
          '          "name": "Submit a request or incident",\n' +
          '          "untranslatedName": "Submit a request or incident",\n' +
          '          "subtask": false,\n' +
          '          "hierarchyLevel": 0,\n' +
          '          "scope": {\n' +
          '            "type": "PROJECT",\n' +
          '            "project": {\n' +
          '              "id": "10069"\n' +
          '            }\n' +
          '          }\n' +
          '        },\n' +
          '        {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10077",\n' +
          '          "id": "10077",\n' +
          '          "description": "Have a question? Submit it here.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10320?size=medium",\n' +
          '          "name": "Ask a question",\n' +
          '          "untranslatedName": "Ask a question",\n' +
          '          "subtask": false,\n' +
          '          "hierarchyLevel": 0,\n' +
          '          "scope": {\n' +
          '            "type": "PROJECT",\n' +
          '            "project": {\n' +
          '              "id": "10069"\n' +
          '            }\n' +
          '          }\n' +
          '        }\n' +
          '      ]\n' +
          '    }\n' +
          '  }\n' +
          '}',
        name: 'get_jira_issue_types',
        additional_kwargs: {},
        response_metadata: {},
        id: 'a8439cc2-176f-421a-92b3-f54506636231',
        lc_direct_tool_output: true,
        status: undefined,
        tool_call_id: 'call_CVtKvCBgA3k8zLkqjX0DvSMu',
        artifact: undefined
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '',
          name: undefined,
          additional_kwargs: {
            function_call: undefined,
            tool_calls: [
              {
                id: 'call_MrQWKZkK7ulwRIs1sDaH4mvW',
                type: 'function',
                function: {
                  name: 'search_jira_users',
                  arguments: '{"query":"Amitvikram Responder"}'
                }
              }
            ]
          },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 1708,
              completion_tokens: 22,
              total_tokens: 1730,
              prompt_tokens_details: { cached_tokens: 1664, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_55d88aaf2f'
          },
          id: 'chatcmpl-BX7uCSZfHnzsM9iUDgjvUyu1GLh3K',
          tool_calls: [
            {
              name: 'search_jira_users',
              args: { query: 'Amitvikram Responder' },
              type: 'tool_call',
              id: 'call_MrQWKZkK7ulwRIs1sDaH4mvW'
            }
          ],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 22,
            input_tokens: 1708,
            total_tokens: 1730,
            input_token_details: { audio: 0, cache_read: 1664 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '',
        name: undefined,
        additional_kwargs: {
          function_call: undefined,
          tool_calls: [
            {
              id: 'call_MrQWKZkK7ulwRIs1sDaH4mvW',
              type: 'function',
              function: {
                name: 'search_jira_users',
                arguments: '{"query":"Amitvikram Responder"}'
              }
            }
          ]
        },
        response_metadata: {
          tokenUsage: {
            promptTokens: 1708,
            completionTokens: 22,
            totalTokens: 1730
          },
          finish_reason: 'tool_calls',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 1708,
            completion_tokens: 22,
            total_tokens: 1730,
            prompt_tokens_details: { cached_tokens: 1664, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_55d88aaf2f'
        },
        id: 'chatcmpl-BX7uCSZfHnzsM9iUDgjvUyu1GLh3K',
        tool_calls: [
          {
            name: 'search_jira_users',
            args: { query: 'Amitvikram Responder' },
            type: 'tool_call',
            id: 'call_MrQWKZkK7ulwRIs1sDaH4mvW'
          }
        ],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 22,
          input_tokens: 1708,
          total_tokens: 1730,
          input_token_details: { audio: 0, cache_read: 1664 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      },
      ToolMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '{\n' +
            '  "success": true,\n' +
            '  "data": {\n' +
            '    "users": [\n' +
            '      {\n' +
            '        "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=60d431a5dae5670068018646",\n' +
            '        "accountId": "60d431a5dae5670068018646",\n' +
            '        "accountType": "atlassian",\n' +
            '        "emailAddress": "",\n' +
            '        "avatarUrls": {\n' +
            '          "48x48": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
            '          "24x24": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
            '          "16x16": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
            '          "32x32": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png"\n' +
            '        },\n' +
            '        "displayName": "Amitvikram Dwivedi",\n' +
            '        "active": true,\n' +
            '        "timeZone": "Asia/Calcutta",\n' +
            '        "locale": "en_US"\n' +
            '      },\n' +
            '      {\n' +
            '        "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=qm:d2c8d8a4-e8bd-4f1d-a31d-e3c38b938efa:38d086fd-6d40-43e6-a181-d768ce491901",\n' +
            '        "accountId": "qm:d2c8d8a4-e8bd-4f1d-a31d-e3c38b938efa:38d086fd-6d40-43e6-a181-d768ce491901",\n' +
            '        "accountType": "customer",\n' +
            '        "emailAddress": "amitvikram@clearfeed.ai",\n' +
            '        "avatarUrls": {\n' +
            '          "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png",\n' +
            '          "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png",\n' +
            '          "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png",\n' +
            '          "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png"\n' +
            '        },\n' +
            '        "displayName": "Amitvikram Dwivedi",\n' +
            '        "active": true,\n' +
            '        "timeZone": "Asia/Calcutta",\n' +
            '        "locale": "en_US"\n' +
            '      }\n' +
            '    ]\n' +
            '  }\n' +
            '}',
          artifact: undefined,
          tool_call_id: 'call_MrQWKZkK7ulwRIs1sDaH4mvW',
          name: 'search_jira_users',
          additional_kwargs: {},
          response_metadata: {},
          id: '8bf47530-dc07-464a-bfd8-a6f1c4f029d8'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '{\n' +
          '  "success": true,\n' +
          '  "data": {\n' +
          '    "users": [\n' +
          '      {\n' +
          '        "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=60d431a5dae5670068018646",\n' +
          '        "accountId": "60d431a5dae5670068018646",\n' +
          '        "accountType": "atlassian",\n' +
          '        "emailAddress": "",\n' +
          '        "avatarUrls": {\n' +
          '          "48x48": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
          '          "24x24": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
          '          "16x16": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
          '          "32x32": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png"\n' +
          '        },\n' +
          '        "displayName": "Amitvikram Dwivedi",\n' +
          '        "active": true,\n' +
          '        "timeZone": "Asia/Calcutta",\n' +
          '        "locale": "en_US"\n' +
          '      },\n' +
          '      {\n' +
          '        "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=qm:d2c8d8a4-e8bd-4f1d-a31d-e3c38b938efa:38d086fd-6d40-43e6-a181-d768ce491901",\n' +
          '        "accountId": "qm:d2c8d8a4-e8bd-4f1d-a31d-e3c38b938efa:38d086fd-6d40-43e6-a181-d768ce491901",\n' +
          '        "accountType": "customer",\n' +
          '        "emailAddress": "amitvikram@clearfeed.ai",\n' +
          '        "avatarUrls": {\n' +
          '          "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png",\n' +
          '          "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png",\n' +
          '          "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png",\n' +
          '          "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/default-avatar.png"\n' +
          '        },\n' +
          '        "displayName": "Amitvikram Dwivedi",\n' +
          '        "active": true,\n' +
          '        "timeZone": "Asia/Calcutta",\n' +
          '        "locale": "en_US"\n' +
          '      }\n' +
          '    ]\n' +
          '  }\n' +
          '}',
        name: 'search_jira_users',
        additional_kwargs: {},
        response_metadata: {},
        id: '8bf47530-dc07-464a-bfd8-a6f1c4f029d8',
        lc_direct_tool_output: true,
        status: undefined,
        tool_call_id: 'call_MrQWKZkK7ulwRIs1sDaH4mvW',
        artifact: undefined
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '',
          name: undefined,
          additional_kwargs: {
            function_call: undefined,
            tool_calls: [
              {
                id: 'call_6vC1gNIDkd7r3lxdC82WSEsk',
                type: 'function',
                function: {
                  name: 'create_jira_issue',
                  arguments: '{"projectKey":"TEST","summary":"Website Performance Issues","description":"Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.","issueTypeId":"10076","priority":"High","assigneeId":"60d431a5dae5670068018646","labels":["performance","website","investigation"]}'
                }
              }
            ]
          },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 2537,
              completion_tokens: 173,
              total_tokens: 2710,
              prompt_tokens_details: { cached_tokens: 2432, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_f5bdcc3276'
          },
          id: 'chatcmpl-BX7uFpjuTD92KM0A4GHb6HqC2VqLc',
          tool_calls: [
            {
              name: 'create_jira_issue',
              args: {
                projectKey: 'TEST',
                summary: 'Website Performance Issues',
                description: 'Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.',
                issueTypeId: '10076',
                priority: 'High',
                assigneeId: '60d431a5dae5670068018646',
                labels: [ 'performance', 'website', 'investigation' ]
              },
              type: 'tool_call',
              id: 'call_6vC1gNIDkd7r3lxdC82WSEsk'
            }
          ],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 173,
            input_tokens: 2537,
            total_tokens: 2710,
            input_token_details: { audio: 0, cache_read: 2432 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '',
        name: undefined,
        additional_kwargs: {
          function_call: undefined,
          tool_calls: [
            {
              id: 'call_6vC1gNIDkd7r3lxdC82WSEsk',
              type: 'function',
              function: {
                name: 'create_jira_issue',
                arguments: '{"projectKey":"TEST","summary":"Website Performance Issues","description":"Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.","issueTypeId":"10076","priority":"High","assigneeId":"60d431a5dae5670068018646","labels":["performance","website","investigation"]}'
              }
            }
          ]
        },
        response_metadata: {
          tokenUsage: {
            promptTokens: 2537,
            completionTokens: 173,
            totalTokens: 2710
          },
          finish_reason: 'tool_calls',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 2537,
            completion_tokens: 173,
            total_tokens: 2710,
            prompt_tokens_details: { cached_tokens: 2432, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_f5bdcc3276'
        },
        id: 'chatcmpl-BX7uFpjuTD92KM0A4GHb6HqC2VqLc',
        tool_calls: [
          {
            name: 'create_jira_issue',
            args: {
              projectKey: 'TEST',
              summary: 'Website Performance Issues',
              description: 'Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.',
              issueTypeId: '10076',
              priority: 'High',
              assigneeId: '60d431a5dae5670068018646',
              labels: [ 'performance', 'website', 'investigation' ]
            },
            type: 'tool_call',
            id: 'call_6vC1gNIDkd7r3lxdC82WSEsk'
          }
        ],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 173,
          input_tokens: 2537,
          total_tokens: 2710,
          input_token_details: { audio: 0, cache_read: 2432 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      },
      ToolMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: '{\n' +
            '  "success": true,\n' +
            '  "data": {\n' +
            '    "issue": {\n' +
            '      "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",\n' +
            '      "id": "10819",\n' +
            '      "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10819",\n' +
            '      "key": "TEST-28",\n' +
            '      "fields": {\n' +
            '        "statuscategorychangedate": "2025-05-14T20:32:02.287+0530",\n' +
            '        "issuetype": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
            '          "id": "10076",\n' +
            '          "description": "Submit a request or report a problem.",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
            '          "name": "Submit a request or incident",\n' +
            '          "subtask": false,\n' +
            '          "avatarId": 10306,\n' +
            '          "entityId": "9e9ecd6e-8b6a-4a11-a47c-1467ed0de848",\n' +
            '          "hierarchyLevel": 0\n' +
            '        },\n' +
            '        "components": [],\n' +
            '        "timespent": null,\n' +
            '        "timeoriginalestimate": null,\n' +
            '        "project": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/project/10069",\n' +
            '          "id": "10069",\n' +
            '          "key": "TEST",\n' +
            '          "name": "test jsm",\n' +
            '          "projectTypeKey": "service_desk",\n' +
            '          "simplified": true,\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406",\n' +
            '            "24x24": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=small",\n' +
            '            "16x16": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=xsmall",\n' +
            '            "32x32": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=medium"\n' +
            '          }\n' +
            '        },\n' +
            '        "customfield_10097": null,\n' +
            '        "description": {\n' +
            '          "type": "doc",\n' +
            '          "version": 1,\n' +
            '          "content": [\n' +
            '            {\n' +
            '              "type": "paragraph",\n' +
            '              "content": [\n' +
            '                {\n' +
            '                  "type": "text",\n' +
            '                  "text": "Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience."\n' +
            '                }\n' +
            '              ]\n' +
            '            }\n' +
            '          ]\n' +
            '        },\n' +
            '        "fixVersions": [],\n' +
            '        "aggregatetimespent": null,\n' +
            '        "customfield_10034": [],\n' +
            '        "statusCategory": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
            '          "id": 2,\n' +
            '          "key": "new",\n' +
            '          "colorName": "blue-gray",\n' +
            '          "name": "To Do"\n' +
            '        },\n' +
            '        "customfield_10035": null,\n' +
            '        "resolution": null,\n' +
            '        "customfield_10036": null,\n' +
            '        "timetracking": {},\n' +
            '        "customfield_10049": null,\n' +
            '        "security": null,\n' +
            '        "attachment": [],\n' +
            '        "aggregatetimeestimate": null,\n' +
            '        "resolutiondate": null,\n' +
            '        "workratio": -1,\n' +
            '        "summary": "Website Performance Issues",\n' +
            '        "watches": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-28/watchers",\n' +
            '          "watchCount": 1,\n' +
            '          "isWatching": true\n' +
            '        },\n' +
            '        "lastViewed": null,\n' +
            '        "creator": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
            '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
            '          "emailAddress": "engineering@clearfeed.ai",\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
            '          },\n' +
            '          "displayName": "ClearFeed Engineering",\n' +
            '          "active": true,\n' +
            '          "timeZone": "Asia/Calcutta",\n' +
            '          "accountType": "atlassian"\n' +
            '        },\n' +
            '        "subtasks": [],\n' +
            '        "created": "2025-05-14T20:32:01.770+0530",\n' +
            '        "reporter": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
            '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
            '          "emailAddress": "engineering@clearfeed.ai",\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
            '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
            '          },\n' +
            '          "displayName": "ClearFeed Engineering",\n' +
            '          "active": true,\n' +
            '          "timeZone": "Asia/Calcutta",\n' +
            '          "accountType": "atlassian"\n' +
            '        },\n' +
            '        "aggregateprogress": {\n' +
            '          "progress": 0,\n' +
            '          "total": 0\n' +
            '        },\n' +
            '        "priority": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/priority/2",\n' +
            '          "iconUrl": "https://clearfeed-testing.atlassian.net/images/icons/priorities/high_new.svg",\n' +
            '          "name": "High",\n' +
            '          "id": "2"\n' +
            '        },\n' +
            '        "customfield_10002": [],\n' +
            '        "labels": [\n' +
            '          "investigation",\n' +
            '          "performance",\n' +
            '          "website"\n' +
            '        ],\n' +
            '        "environment": null,\n' +
            '        "timeestimate": null,\n' +
            '        "aggregatetimeoriginalestimate": null,\n' +
            '        "versions": [],\n' +
            '        "duedate": null,\n' +
            '        "progress": {\n' +
            '          "progress": 0,\n' +
            '          "total": 0\n' +
            '        },\n' +
            '        "issuelinks": [],\n' +
            '        "votes": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-28/votes",\n' +
            '          "votes": 0,\n' +
            '          "hasVoted": false\n' +
            '        },\n' +
            '        "comment": {\n' +
            '          "comments": [],\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10819/comment",\n' +
            '          "maxResults": 0,\n' +
            '          "total": 0,\n' +
            '          "startAt": 0\n' +
            '        },\n' +
            '        "assignee": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=60d431a5dae5670068018646",\n' +
            '          "accountId": "60d431a5dae5670068018646",\n' +
            '          "avatarUrls": {\n' +
            '            "48x48": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
            '            "24x24": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
            '            "16x16": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
            '            "32x32": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png"\n' +
            '          },\n' +
            '          "displayName": "Amitvikram Dwivedi",\n' +
            '          "active": true,\n' +
            '          "timeZone": "Asia/Calcutta",\n' +
            '          "accountType": "atlassian"\n' +
            '        },\n' +
            '        "worklog": {\n' +
            '          "startAt": 0,\n' +
            '          "maxResults": 20,\n' +
            '          "total": 0,\n' +
            '          "worklogs": []\n' +
            '        },\n' +
            '        "updated": "2025-05-14T20:32:01.981+0530",\n' +
            '        "status": {\n' +
            '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/status/10051",\n' +
            '          "description": "",\n' +
            '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/",\n' +
            '          "name": "To Do",\n' +
            '          "id": "10051",\n' +
            '          "statusCategory": {\n' +
            '            "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
            '            "id": 2,\n' +
            '            "key": "new",\n' +
            '            "colorName": "blue-gray",\n' +
            '            "name": "To Do"\n' +
            '          }\n' +
            '        }\n' +
            '      },\n' +
            '      "url": "https://clearfeed-testing.atlassian.net/browse/TEST-28"\n' +
            '    }\n' +
            '  }\n' +
            '}',
          artifact: undefined,
          tool_call_id: 'call_6vC1gNIDkd7r3lxdC82WSEsk',
          name: 'create_jira_issue',
          additional_kwargs: {},
          response_metadata: {},
          id: '622fb43e-00a3-4e8b-bc6a-4bd2820f0d82'
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: '{\n' +
          '  "success": true,\n' +
          '  "data": {\n' +
          '    "issue": {\n' +
          '      "expand": "renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations",\n' +
          '      "id": "10819",\n' +
          '      "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10819",\n' +
          '      "key": "TEST-28",\n' +
          '      "fields": {\n' +
          '        "statuscategorychangedate": "2025-05-14T20:32:02.287+0530",\n' +
          '        "issuetype": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issuetype/10076",\n' +
          '          "id": "10076",\n' +
          '          "description": "Submit a request or report a problem.",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/2/universal_avatar/view/type/issuetype/avatar/10306?size=medium",\n' +
          '          "name": "Submit a request or incident",\n' +
          '          "subtask": false,\n' +
          '          "avatarId": 10306,\n' +
          '          "entityId": "9e9ecd6e-8b6a-4a11-a47c-1467ed0de848",\n' +
          '          "hierarchyLevel": 0\n' +
          '        },\n' +
          '        "components": [],\n' +
          '        "timespent": null,\n' +
          '        "timeoriginalestimate": null,\n' +
          '        "project": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/project/10069",\n' +
          '          "id": "10069",\n' +
          '          "key": "TEST",\n' +
          '          "name": "test jsm",\n' +
          '          "projectTypeKey": "service_desk",\n' +
          '          "simplified": true,\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406",\n' +
          '            "24x24": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=small",\n' +
          '            "16x16": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=xsmall",\n' +
          '            "32x32": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/universal_avatar/view/type/project/avatar/10406?size=medium"\n' +
          '          }\n' +
          '        },\n' +
          '        "customfield_10097": null,\n' +
          '        "description": {\n' +
          '          "type": "doc",\n' +
          '          "version": 1,\n' +
          '          "content": [\n' +
          '            {\n' +
          '              "type": "paragraph",\n' +
          '              "content": [\n' +
          '                {\n' +
          '                  "type": "text",\n' +
          '                  "text": "Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience."\n' +
          '                }\n' +
          '              ]\n' +
          '            }\n' +
          '          ]\n' +
          '        },\n' +
          '        "fixVersions": [],\n' +
          '        "aggregatetimespent": null,\n' +
          '        "customfield_10034": [],\n' +
          '        "statusCategory": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
          '          "id": 2,\n' +
          '          "key": "new",\n' +
          '          "colorName": "blue-gray",\n' +
          '          "name": "To Do"\n' +
          '        },\n' +
          '        "customfield_10035": null,\n' +
          '        "resolution": null,\n' +
          '        "customfield_10036": null,\n' +
          '        "timetracking": {},\n' +
          '        "customfield_10049": null,\n' +
          '        "security": null,\n' +
          '        "attachment": [],\n' +
          '        "aggregatetimeestimate": null,\n' +
          '        "resolutiondate": null,\n' +
          '        "workratio": -1,\n' +
          '        "summary": "Website Performance Issues",\n' +
          '        "watches": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-28/watchers",\n' +
          '          "watchCount": 1,\n' +
          '          "isWatching": true\n' +
          '        },\n' +
          '        "lastViewed": null,\n' +
          '        "creator": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
          '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
          '          "emailAddress": "engineering@clearfeed.ai",\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
          '          },\n' +
          '          "displayName": "ClearFeed Engineering",\n' +
          '          "active": true,\n' +
          '          "timeZone": "Asia/Calcutta",\n' +
          '          "accountType": "atlassian"\n' +
          '        },\n' +
          '        "subtasks": [],\n' +
          '        "created": "2025-05-14T20:32:01.770+0530",\n' +
          '        "reporter": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=6421ef9a67102fc717c1df2d",\n' +
          '          "accountId": "6421ef9a67102fc717c1df2d",\n' +
          '          "emailAddress": "engineering@clearfeed.ai",\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "24x24": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "16x16": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png",\n' +
          '            "32x32": "https://secure.gravatar.com/avatar/59f10caa1f2c52313b9711921a1e287b?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FCE-3.png"\n' +
          '          },\n' +
          '          "displayName": "ClearFeed Engineering",\n' +
          '          "active": true,\n' +
          '          "timeZone": "Asia/Calcutta",\n' +
          '          "accountType": "atlassian"\n' +
          '        },\n' +
          '        "aggregateprogress": {\n' +
          '          "progress": 0,\n' +
          '          "total": 0\n' +
          '        },\n' +
          '        "priority": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/priority/2",\n' +
          '          "iconUrl": "https://clearfeed-testing.atlassian.net/images/icons/priorities/high_new.svg",\n' +
          '          "name": "High",\n' +
          '          "id": "2"\n' +
          '        },\n' +
          '        "customfield_10002": [],\n' +
          '        "labels": [\n' +
          '          "investigation",\n' +
          '          "performance",\n' +
          '          "website"\n' +
          '        ],\n' +
          '        "environment": null,\n' +
          '        "timeestimate": null,\n' +
          '        "aggregatetimeoriginalestimate": null,\n' +
          '        "versions": [],\n' +
          '        "duedate": null,\n' +
          '        "progress": {\n' +
          '          "progress": 0,\n' +
          '          "total": 0\n' +
          '        },\n' +
          '        "issuelinks": [],\n' +
          '        "votes": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/TEST-28/votes",\n' +
          '          "votes": 0,\n' +
          '          "hasVoted": false\n' +
          '        },\n' +
          '        "comment": {\n' +
          '          "comments": [],\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/issue/10819/comment",\n' +
          '          "maxResults": 0,\n' +
          '          "total": 0,\n' +
          '          "startAt": 0\n' +
          '        },\n' +
          '        "assignee": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/user?accountId=60d431a5dae5670068018646",\n' +
          '          "accountId": "60d431a5dae5670068018646",\n' +
          '          "avatarUrls": {\n' +
          '            "48x48": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
          '            "24x24": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
          '            "16x16": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png",\n' +
          '            "32x32": "https://secure.gravatar.com/avatar/6f89875b2919abe570b79f0cad6bafe0?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FAD-4.png"\n' +
          '          },\n' +
          '          "displayName": "Amitvikram Dwivedi",\n' +
          '          "active": true,\n' +
          '          "timeZone": "Asia/Calcutta",\n' +
          '          "accountType": "atlassian"\n' +
          '        },\n' +
          '        "worklog": {\n' +
          '          "startAt": 0,\n' +
          '          "maxResults": 20,\n' +
          '          "total": 0,\n' +
          '          "worklogs": []\n' +
          '        },\n' +
          '        "updated": "2025-05-14T20:32:01.981+0530",\n' +
          '        "status": {\n' +
          '          "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/status/10051",\n' +
          '          "description": "",\n' +
          '          "iconUrl": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/",\n' +
          '          "name": "To Do",\n' +
          '          "id": "10051",\n' +
          '          "statusCategory": {\n' +
          '            "self": "https://api.atlassian.com/ex/jira/5af33b11-85f9-4c9a-a6d5-249a362c4325/rest/api/3/statuscategory/2",\n' +
          '            "id": 2,\n' +
          '            "key": "new",\n' +
          '            "colorName": "blue-gray",\n' +
          '            "name": "To Do"\n' +
          '          }\n' +
          '        }\n' +
          '      },\n' +
          '      "url": "https://clearfeed-testing.atlassian.net/browse/TEST-28"\n' +
          '    }\n' +
          '  }\n' +
          '}',
        name: 'create_jira_issue',
        additional_kwargs: {},
        response_metadata: {},
        id: '622fb43e-00a3-4e8b-bc6a-4bd2820f0d82',
        lc_direct_tool_output: true,
        status: undefined,
        tool_call_id: 'call_6vC1gNIDkd7r3lxdC82WSEsk',
        artifact: undefined
      },
      AIMessage {
        lc_serializable: true,
        lc_kwargs: {
          content: 'The Jira issue has been successfully created in the TEST project. Here are the details:\n' +
            '\n' +
            '- **Summary:** Website Performance Issues\n' +
            '- **Description:** Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
            '- **Priority:** High\n' +
            '- **Assignee:** Amitvikram Dwivedi\n' +
            '- **Labels:** performance, website, investigation\n' +
            '\n' +
            'You can view the issue [here](https://clearfeed-testing.atlassian.net/browse/TEST-28).',
          name: undefined,
          additional_kwargs: { function_call: undefined, tool_calls: undefined },
          response_metadata: {
            model_name: 'gpt-4o-2024-08-06',
            usage: {
              prompt_tokens: 5936,
              completion_tokens: 193,
              total_tokens: 6129,
              prompt_tokens_details: { cached_tokens: 2688, audio_tokens: 0 },
              completion_tokens_details: {
                reasoning_tokens: 0,
                audio_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0
              }
            },
            system_fingerprint: 'fp_f5bdcc3276'
          },
          id: 'chatcmpl-BX7uNZkxFTWaYzF7Vpk1XFvM6uL6b',
          tool_calls: [],
          invalid_tool_calls: [],
          usage_metadata: {
            output_tokens: 193,
            input_tokens: 5936,
            total_tokens: 6129,
            input_token_details: { audio: 0, cache_read: 2688 },
            output_token_details: { audio: 0, reasoning: 0 }
          }
        },
        lc_namespace: [ 'langchain_core', 'messages' ],
        content: 'The Jira issue has been successfully created in the TEST project. Here are the details:\n' +
          '\n' +
          '- **Summary:** Website Performance Issues\n' +
          '- **Description:** Our website has been experiencing unusually slow loading times, which is affecting the overall user experience. Pages are taking several seconds to load, and in some cases, failing to load completely. This issue appears to be caused by a combination of high server response times, unoptimized images, and excessive JavaScript execution on the client side. As a result, users may face delays in accessing content, which can lead to frustration and increased bounce rates. We are currently investigating the root cause and implementing optimizations to improve performance and ensure a smoother, faster browsing experience.\n' +
          '- **Priority:** High\n' +
          '- **Assignee:** Amitvikram Dwivedi\n' +
          '- **Labels:** performance, website, investigation\n' +
          '\n' +
          'You can view the issue [here](https://clearfeed-testing.atlassian.net/browse/TEST-28).',
        name: undefined,
        additional_kwargs: { function_call: undefined, tool_calls: undefined },
        response_metadata: {
          tokenUsage: {
            promptTokens: 5936,
            completionTokens: 193,
            totalTokens: 6129
          },
          finish_reason: 'stop',
          model_name: 'gpt-4o-2024-08-06',
          usage: {
            prompt_tokens: 5936,
            completion_tokens: 193,
            total_tokens: 6129,
            prompt_tokens_details: { cached_tokens: 2688, audio_tokens: 0 },
            completion_tokens_details: {
              reasoning_tokens: 0,
              audio_tokens: 0,
              accepted_prediction_tokens: 0,
              rejected_prediction_tokens: 0
            }
          },
          system_fingerprint: 'fp_f5bdcc3276'
        },
        id: 'chatcmpl-BX7uNZkxFTWaYzF7Vpk1XFvM6uL6b',
        tool_calls: [],
        invalid_tool_calls: [],
        usage_metadata: {
          output_tokens: 193,
          input_tokens: 5936,
          total_tokens: 6129,
          input_token_details: { audio: 0, cache_read: 2688 },
          output_token_details: { audio: 0, reasoning: 0 }
        }
      }
    ]
  }
}