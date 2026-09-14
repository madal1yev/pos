import dotenv from 'dotenv';
dotenv.config();
import { AIProviderInterface, AIProviderConfig } from './ai.types';
import { APP_CONFIG } from '../../config/app';
import logger from '../../infrastructure/logger';
import { OpenAIProvider } from './providers/openai.provider';

class AIProviderManager {
  private static instance: AIProviderManager;
  private provider: AIProviderInterface | null = null;
  private providers: Map<string, AIProviderInterface> = new Map();

  private constructor() {}

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
      AIProviderManager.instance.initialize();
    }
    return AIProviderManager.instance;
  }

  private initialize(): void {
    const providerName = APP_CONFIG.aiProvider;

    const openai = new OpenAIProvider();
    this.providers.set('openai', openai);

    if (providerName === 'openai' || !providerName) {
      this.provider = openai;
    }

    logger.info(`🤖 AI Provider initialized: ${this.provider?.name || providerName}`);
  }

  getProvider(name?: string): AIProviderInterface | null {
    return this.provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch {
        results[name] = false;
      }
    }
    return results;
  }
}

export const aiProviderManager = AIProviderManager.getInstance();
export default aiProviderManager;
