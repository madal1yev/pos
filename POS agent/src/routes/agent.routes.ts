import { Router } from 'express';
import { agentEngine } from '../modules/agent/agent.engine';
import { toolRegistry } from '../modules/tools/tools.registry';
import { tenantFilter } from '../modules/tenants/tenant.middleware';

const r = Router();

r.post('/chat', tenantFilter, async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const response = await agentEngine.processMessage({
      tenantId: req.tenantId || 1,
      telegramChatId: req.body.chatId || 0,
      message,
      language: language || 'uz',
      userId: req.body.userId,
      requestId: `api_${Date.now()}`,
    });

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

r.get('/tools', tenantFilter, async (_req, res) => {
  try {
    const readTools = toolRegistry.getReadTools().map((t) => ({ name: t.name, description: t.description, type: t.type, riskLevel: t.riskLevel }));
    const writeTools = toolRegistry.getWriteTools().map((t) => ({ name: t.name, description: t.description, type: t.type, riskLevel: t.riskLevel, requireConfirmation: t.requireConfirmation }));
    res.json({ read: readTools, write: writeTools });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

r.post('/confirm', tenantFilter, async (req, res) => {
  try {
    const { toolName, input } = req.body;
    const tool = toolRegistry.getTool(toolName);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    const result = await toolRegistry.execute(toolName, { ...input, confirm: true }, req.tenantId || 1, `api_${Date.now()}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { r as agentRoutes };
