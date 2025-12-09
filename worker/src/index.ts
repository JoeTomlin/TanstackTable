import { chat } from './services/chat';
import { tableTools } from './tools/definitions/tableTools';
import { executeToolCall } from './tools/executor';
import type { Message } from './types/messages';
import type { Env } from './types/env';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers for frontend communication
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Chat endpoint - main AI interaction
      if (url.pathname === '/chat' && request.method === 'POST') {
        const body = await request.json();
        const { messages, clientDate, clientDateReadable } = body as { 
          messages: Message[];
          clientDate?: string;
          clientDateReadable?: string;
        };
        
        if (!messages || !Array.isArray(messages)) {
          return new Response(
            JSON.stringify({ error: 'Invalid request: messages array required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Pass tools and client's local date to chat function
        const response = await chat({
          messages,
          tools: tableTools,
          env,
          clientDate,
          clientDateReadable
        });
        
        // Add CORS headers to streaming response
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders
        });
      }

      // Health check endpoint
      if (url.pathname === '/health' && request.method === 'GET') {
        return new Response(
          JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Direct tool execution endpoint (useful for testing)
      if (url.pathname === '/tool' && request.method === 'POST') {
        const body = await request.json();
        const { toolName, args } = body;
        
        const toolCall = {
          id: 'test-call',
          type: 'function' as const,
          function: {
            name: toolName,
            arguments: JSON.stringify(args)
          }
        };
        
        const result = await executeToolCall(toolCall, env);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('Request error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};