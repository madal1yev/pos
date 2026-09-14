export interface AIProviderConfig {
  name: string;
  apiKey?: string;
  model: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  tools?: any[];
  toolChoice?: any;
}

export interface AIProviderInterface {
  name: string;
  generateMessage(messages: AIMessage[], config?: Partial<AIProviderConfig>): Promise<AIAIResponse>;
  streamMessage?(messages: AIMessage[], config?: Partial<AIProviderConfig>): AsyncGenerator<string>;
  healthCheck(): Promise<boolean>;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: AIToolCall[];
  tool_call_id?: string;
  tool_result?: string;
}

export interface AIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIAIResponse {
  content: string;
  toolCalls?: AIToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
  model: string;
  provider: string;
}

export interface AIAgentConfig {
  maxTokens: number;
  temperature: number;
  maxHistoryMessages: number;
  memoryMaxEntries: number;
  toolTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  type: 'read' | 'write';
  schema: Record<string, any>;
  tenantRequired: boolean;
  requireConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  handler: Function;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  toolName: string;
  executionTimeMs: number;
  confirmationRequired?: boolean;
}

export interface AgentMessage {
  tenantId: number;
  telegramChatId: number;
  message: string;
  language: string;
  userId?: number;
  requestId: string;
  conversationId?: number;
}

export interface AgentResponse {
  text: string;
  toolsUsed: string[];
  memoryUpdated: boolean;
  actionTaken: boolean;
  confidence: number;
}

export interface ToolCallRecord {
  tenantId: number;
  agentTaskId: number;
  toolName: string;
  toolType: 'read' | 'write';
  input: string;
  output: string;
  status: string;
  executionTimeMs: number;
}

export interface TenantContext {
  tenantId: number;
  settings: Record<string, any>;
  language: string;
  timezone: string;
  currency: string;
  lowStockThreshold: number;
}
