import { agentEngine } from '../../src/modules/agent/agent.engine';
import { db } from '../../src/config/database';
import { logger } from '../../src/infrastructure/logger';

describe('Agent Engine', () => {
  beforeAll(async () => {
    await db.query('SELECT 1');
  });

  test('should initialize agent engine', () => {
    expect(agentEngine).toBeDefined();
    expect(agentEngine.processMessage).toBeDefined();
  });

  test('processMessage should return a response', async () => {
    const result = await agentEngine.processMessage({
      tenantId: 1,
      telegramChatId: 1,
      message: "Bugungi savdo qancha?",
      language: 'uz',
      requestId: 'test_001',
    });

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('toolsUsed');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.text).toBe('string');
  });

  test('should return response in Uzbek language', async () => {
    const result = await agentEngine.processMessage({
      tenantId: 1, telegramChatId: 2, message: "Kam qolgan mahsulotlar", language: 'uz', requestId: 'test_002'
    });
    expect(result.text).toBeDefined();
  });

  test('should return response in Russian language', async () => {
    const result = await agentEngine.processMessage({
      tenantId: 1, telegramChatId: 3, message: "Какой сегодня доход?", language: 'ru', requestId: 'test_003'
    });
    expect(result.text).toBeDefined();
  });
});
