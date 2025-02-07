import OpenAI from 'openai';
import config from '../config';
import { toolHandlers } from '../constants/tools';
import { tools } from '../constants/tools';
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});


export async function processMessage(message: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that can interact with various business tools and APIs. Use the available tools to help users find the information they need.',
      },
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

    if (functionName in toolHandlers) {
      const result = await toolHandlers[functionName](args);
      return generateResponse(message, result, functionName);
    }
  }

  return responseMessage.content ?? '';
}

const generateResponse = async (message: string, result: Record<string, any>, functionName: string): Promise<string> => {
  const formattedResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'You are a business assistant. Given a user\'s query and structured API data, generate a response that directly answers the user\'s question in a clear and concise manner.' },
      { role: 'user', content: `User's question: "${message}"` },
      { role: 'user', content: `Here is the structured response from ${functionName}: ${JSON.stringify(result, null, 2)}` },
    ],
  });

  return formattedResponse.choices[0].message.content ?? '';
};
