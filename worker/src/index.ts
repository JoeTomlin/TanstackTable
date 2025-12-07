import { chat } from './services/chat';
import { getAllTools } from './tools/definitions';
import { executeToolCall } from './tools/executor';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'POST' && new URL(request.url).pathname === '/chat') {
      const { messages } = await request.json();
      const tools = getAllTools();
      return chat({ messages, tools, env });
    }
    // Add other routes for table operations, etc.
  }
}