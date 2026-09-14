import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();
import { AIProviderInterface, AIMessage, AIAIResponse, AIProviderConfig } from '../ai.types';
import { APP_CONFIG } from '../../../config/app';
import logger from '../../../infrastructure/logger';

export class OpenAIProvider implements AIProviderInterface {
  name = 'openai';
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || APP_CONFIG.openaiApiKey,
        baseURL: process.env.OPENAI_BASE_URL,
        timeout: APP_CONFIG.agentToolTimeout,
      });
    }
    return this.client;
  }

  async generateMessage(messages: AIMessage[], config?: Partial<AIProviderConfig>): Promise<AIAIResponse> {
    const model = config?.model || APP_CONFIG.openaiModel || 'gpt-4o-mini';
    const maxTokens = config?.maxTokens || APP_CONFIG.agentMaxTokens;
    const temperature = config?.temperature ?? APP_CONFIG.agentTemperature;

    const formattedMessages: any[] = messages.map((m) => {
      if (m.role === 'tool') {
        return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id || 'call_unknown' };
      }
      if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
        return { role: 'assistant', content: m.content || null, tool_calls: m.tool_calls };
      }
      return { role: m.role, content: m.content };
    });

    try {
      const response = await this.getClient().chat.completions.create({
        model,
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature,
        ...(config?.tools && config.tools.length > 0
          ? { tools: config.tools, tool_choice: config.toolChoice || 'auto' }
          : {}),
      } as any);

      const choice = response.choices[0];
      const content = choice.message?.content || '';
      const toolCalls = (choice.message as any)?.tool_calls || [];
      const usage = response.usage;

      return {
        content,
        toolCalls: toolCalls.map((tc: any) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
          cost: usage?.total_tokens ? (usage.total_tokens * 0.002) / 1000 : 0,
        },
        model,
        provider: this.name,
      };
    } catch (err: any) {
      logger.error(`OpenAI error: ${err.message}`);
      throw err;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY && !APP_CONFIG.openaiApiKey) return false;
      const client = this.getClient();
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
