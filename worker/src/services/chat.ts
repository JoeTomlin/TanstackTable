import type { Message, ToolDefinition, ToolCall } from '../types/messages';
import type { Env } from '../types/env';
import { executeToolCall } from '../tools/executor';

// System prompt to minimize hallucination
const SYSTEM_PROMPT = `You are a contract management assistant. You help users manage their contracts database.

IMPORTANT RULES:
1. ONLY use the tools provided to interact with contracts. Never make up contract data.
2. When asked about contracts, ALWAYS use getContracts or search tools first to get real data.
3. If a tool returns an error or "not found", report that honestly - don't pretend it succeeded.
4. For updates/deletes by name, use updateContractByName or deleteContractByName tools.
5. Never claim an action was successful unless the tool result confirms success.
6. If you're unsure about something, say so - don't guess.
7. Keep responses concise and focused on the task.

Available actions:
- View contracts: getContracts, getContractById, searchTable, filterTable
- Create: addContract (requires contractName, clientName, value, startDate, endDate, status)
- Update: updateContractByName (provide contract name and fields to update)
- Delete: deleteContractByName (provide contract name)
- Calculations: calculateTotalValue, calculateAverageValue, groupByClient, groupByStatus
- Table operations: sortTable, filterTable, filterMultipleColumns

Status values: active, pending, expired, cancelled
Date format: YYYY-MM-DD`;

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

  // Build conversation with system prompt
  let conversationMessages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
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
      content: assistantMessage.content,
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

    // If this was a data modification, include the result directly
    const lastResult = toolResults[toolResults.length - 1]?.result as Record<string, unknown>;
    if (lastResult?.success && (lastResult?.contract || lastResult?.contracts)) {
      // Return tool result with AI context
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
      
      if (contextResponse.ok) {
        const contextCompletion = await contextResponse.json() as {
          choices: Array<{ message: { content: string } }>;
        };
        
        return new Response(JSON.stringify({
          success: true,
          message: contextCompletion.choices[0].message.content,
          toolResults: toolResults.map(tr => tr.result),
          // Include contracts data for frontend to update
          ...(lastResult.contract ? { contract: lastResult.contract } : {}),
          ...(lastResult.contracts ? { contracts: lastResult.contracts } : {})
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  return new Response(JSON.stringify({
    success: false,
    message: 'Max iterations reached'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
