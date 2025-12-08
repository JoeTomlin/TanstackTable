import { useState, useCallback } from 'react';
import type { Message, ToolResult } from '../types';

const API_BASE = 'http://localhost:8787';

export function useChat(onToolResult: (result: ToolResult) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      
      // Add assistant message
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'Done!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Handle tool results
      if (data.toolResults && data.toolResults.length > 0) {
        for (const result of data.toolResults) {
          onToolResult(result);
        }
      }

      // If there's contract data, trigger a refresh
      if (data.contract || data.contracts) {
        onToolResult({
          success: true,
          ...(data.contract ? { contract: data.contract } : {}),
          ...(data.contracts ? { contracts: data.contracts } : {})
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, onToolResult]);

  return { messages, isLoading, sendMessage };
}
