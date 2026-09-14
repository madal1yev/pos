export interface ToolSchema {
  name: string;
  type: 'read' | 'write';
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  tenantRequired: boolean;
  requireConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
  handler: Function;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  toolName: string;
  executionTimeMs: number;
  confirmationRequired?: boolean;
  message?: string;
}

export interface ToolExecutionContext {
  tenantId: number;
  userId?: number;
  requestId: string;
  confirm?: boolean;
}

export interface ToolValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedInput: Record<string, any>;
}
