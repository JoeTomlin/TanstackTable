import type { Message, ToolDefinition, ToolCall } from '../types/messages';
import type { Env } from '../types/env';
import { executeToolCall } from '../tools/executor';

// Generate system prompt with current date (from client's local timezone)
function getSystemPrompt(formattedDate: string, readableDate: string): string {
  return `You are a contract management assistant. You help users manage their contracts database.

CURRENT DATE: ${readableDate} (${formattedDate})
Use this date when the user refers to "today", "now", "current date", etc.

IMPORTANT RULES:
1. ONLY use the tools provided to interact with contracts. Never make up contract data.
2. When asked about contracts, ALWAYS use getContracts or search tools first to get real data.
3. If a tool returns an error or "not found", report that honestly - don't pretend it succeeded.
4. For updates/deletes by name, use updateContractByName or deleteContractByName tools.
5. Never claim an action was successful unless the tool result confirms success.
6. If you're unsure about something, say so - don't guess.
7. Keep responses concise and focused on the task.
8. When creating contracts with relative dates like "today", "next month", "in 6 months", calculate the actual date using ${formattedDate} as today.

Available actions:
- View contracts: getContracts, getContractById, searchTable, filterTable
- Create: addContract (requires contractName, clientName, value, startDate, endDate, status)
- Update: updateContractByName (provide contract name and fields to update)
- Delete: deleteContractByName (provide contract name)
- Calculations: calculateTotalValue, calculateAverageValue, groupByClient, groupByStatus
- Table operations: sortTable, filterTable, filterMultipleColumns

Status values: active, pending, expired, cancelled
Date format: YYYY-MM-DD`;
}

export async function chat(args: {
  messages: Message[];
  tools: ToolDefinition[];
  env: Env;
  clientDate?: string;  // YYYY-MM-DD from client's local timezone
  clientDateReadable?: string; // Human-readable date from client
}): Promise<Response> {
  const { messages, tools, env, clientDate, clientDateReadable } = args;
  
  // Use client's local date or fall back to UTC
  const today = new Date();
  const formattedDate = clientDate || today.toISOString().split('T')[0];
  const readableDate = clientDateReadable || today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Convert tools to OpenAI format
  const openAITools = tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  // Build conversation with system prompt (includes client's local date)
  let conversationMessages: Message[] = [
    { role: 'system', content: getSystemPrompt(formattedDate, readableDate) },
    ...messages
  ];
  let maxIterations = 5; // Prevent infinite loops
  
  while (maxIterations > 0) {
    maxIterations--;
    
    // Call OpenAI (non-streaming to handle tool calls)
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools: openAITools,
        tool_choice: 'auto',
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      return new Response(JSON.stringify(error), { 
        status: openAIResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const completion = await openAIResponse.json() as {
      choices: Array<{
        message: {
          role: string;
          content: string | null;
          tool_calls?: ToolCall[];
        };
        finish_reason: string;
      }>;
    };

    const assistantMessage = completion.choices[0].message;
    
    // If no tool calls, return the response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: assistantMessage.content,
        role: 'assistant'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute tool calls
    conversationMessages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: assistantMessage.tool_calls
    });

    const toolResults: Array<{ toolCallId: string; result: unknown }> = [];
    
    for (const toolCall of assistantMessage.tool_calls) {
      console.log(`Executing tool: ${toolCall.function.name}`);
      const result = await executeToolCall(toolCall, env);
      toolResults.push({ toolCallId: toolCall.id, result });
      
      // Add tool result to conversation
      conversationMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    // Check if any tool returned a successful result
    const lastResult = toolResults[toolResults.length - 1]?.result as Record<string, unknown>;
    
    if (lastResult?.success) {
      // Get AI's natural language response
      const contextResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: conversationMessages,
        }),
      });
      
      let aiMessage = lastResult.message as string || 'Done!';
      if (contextResponse.ok) {
        const contextCompletion = await contextResponse.json() as {
          choices: Array<{ message: { content: string } }>;
        };
        aiMessage = contextCompletion.choices[0].message.content;
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: aiMessage,
        toolResults: toolResults.map(tr => tr.result),
        // Include data for frontend to update
        ...(lastResult.contract ? { contract: lastResult.contract } : {}),
        ...(lastResult.contracts ? { contracts: lastResult.contracts } : {}),
        // Include table actions (filter, sort, search, pagination)
        ...(lastResult.action ? { action: lastResult.action } : {}),
        ...(lastResult.filter ? { filter: lastResult.filter } : {}),
        ...(lastResult.sort ? { sort: lastResult.sort } : {}),
        ...(lastResult.search ? { search: lastResult.search } : {}),
        ...(lastResult.filters ? { filters: lastResult.filters } : {}),
        ...(lastResult.pageSize ? { pageSize: lastResult.pageSize } : {}),
        ...(lastResult.pageNumber ? { pageNumber: lastResult.pageNumber } : {}),
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({
    success: false,
    message: 'Max iterations reached'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
