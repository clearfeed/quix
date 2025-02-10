import OpenAI from 'openai';
import config from '../config';
import { toolHandlers } from '../constants/tools';
import { tools } from '../constants/tools';
import logger from '../utils/logger';
import { OpenAIContext } from '../types';
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export async function processMessage(message: string, previousMessages: OpenAIContext[]): Promise<string> {

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `
        Your name is Quix, you are a helpful assistant that must use the available tools when relevant to answer the user\'s queries.
        You must use the tools to answer the user's queries.
        You must not make up information, you must only use the tools to answer the user's queries.
        You must answer the user's queries in a clear and concise manner.
        You should ask the user to provide more information if they don't provide enough information to answer the question.
        If you don't have enough information to answer the user's query, you should say so.
        `,
      },
      ...previousMessages,
      { role: 'user', content: message },
    ],
    tools,
    tool_choice: 'auto',
  });

  const responseMessage = response.choices[0].message;

  if (responseMessage.tool_calls?.[0]) {
    const toolCall = responseMessage.tool_calls[0];
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    logger.info(`Tool call: ${functionName} with args: ${JSON.stringify(args)}`);

    if (functionName in toolHandlers) {
      const result = await toolHandlers[functionName](args);
      return generateResponse(message, result, functionName);
    }
  } else {
    logger.info(`No tool call found in response: ${JSON.stringify(responseMessage)}`);
  }
  return responseMessage.content ?? 'I\'m sorry, I don\'t know how to answer that. Please try again with a different question.';
}

const generateResponse = async (message: string, result: Record<string, any>, functionName: string): Promise<string> => {
  const formattedResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system', content: `
        You are a business assistant. Given a user's query and structured API data, generate a response that directly answers the user's question in a clear and concise manner. Format the response as a Slack message using Slack's supported markdown syntax:

- Use <URL|Text> for links instead of [text](URL).
- Use *bold* instead of **bold**.
- Ensure proper line breaks by using \n\n between list items.
- Retain code blocks using triple backticks where needed.
- Ensure all output is correctly formatted to display properly in Slack.
        ` },
      { role: 'user', content: `User's question: "${message}"` },
      { role: 'user', content: `Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}` }
    ],
  });

  return formattedResponse.choices[0].message.content ?? '';
};
