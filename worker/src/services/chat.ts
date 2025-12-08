import type { Message, ToolDefinition } from '../types/messages';
import type { Env } from '../types/env';

export async function chat(args: {
  messages: Message[];
  tools: ToolDefinition[];
  env: Env;
}): Promise<Response> {
  const { messages, tools, env } = args;
  
  // Convert tools to OpenAI format
  const openAITools = tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
  
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      tools: openAITools,
      tool_choice: 'auto',
      stream: true,
    }),
  });

  if (!openAIResponse.body) {
    return new Response('No body from OpenAI', { status: 500 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const reader = openAIResponse.body!.getReader();
      const pump = (): void => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            pump();
          })
          .catch((err) => controller.error(err));
      };
      pump();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}