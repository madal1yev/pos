import { db } from '../../config/database';
import logger from '../../infrastructure/logger';
import cache from '../../infrastructure/cache';
import { APP_CONFIG } from '../../config/app';
import { AgentEngine } from '../agent/agent.engine';
import { withRetry } from '../../infrastructure/error-handler';

export class AutomationEngine {
  private agentEngine: AgentEngine;
  isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.agentEngine = new AgentEngine();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('🔄 Automation engine started');
    this.checkInterval = setInterval(() => this.checkAndRun(), APP_CONFIG.schedulerIntervalMs);
    await this.checkAndRun();
  }

  stop(): void {
    this.isRunning = false;
    if (this.checkInterval) { clearInterval(this.checkInterval); this.checkInterval = null; }
    logger.info('🛑 Automation engine stopped');
  }

  async checkAndRun(): Promise<void> {
    try {
      const automations = await db.query(`SELECT * FROM automations WHERE is_active = 1`);
      for (const automation of automations.rows) {
        await this.evaluateAutomation(automation);
      }
    } catch (err) {
      logger.error(`Automation check error: ${err}`);
    }
  }

  private async evaluateAutomation(automation: any): Promise<void> {
    const { id, tenant_id, trigger_type, trigger_config, action_type, action_config, timezone } = automation;
    try {
      const shouldRun = await this.shouldTrigger(trigger_type, trigger_config);
      if (!shouldRun) return;
      await withRetry(async () => {
        await db.run(`INSERT INTO automation_runs (automation_id, tenant_id, status, started_at) VALUES ($1, $2, 'running', $3)`, [id, tenant_id, new Date().toISOString()]);
        await db.run(`UPDATE automations SET last_run_at = $1, run_count = run_count + 1 WHERE id = $2`, [new Date().toISOString(), id]);
      }, 3, 2000, `automation:${id}`);
    } catch (err: any) {
      logger.error(`Automation ${id} failed: ${err?.message || err}`);
    }
  }

  private async shouldTrigger(triggerType: string, config: string): Promise<boolean> {
    try {
      const trigger = JSON.parse(config);
      if (triggerType === 'schedule') {
        const cron = trigger.cron || trigger.schedule;
        if (!cron) return false;
        return this.matchCron(cron);
      }
      return true;
    } catch { return false; }
  }

  private matchCron(cron: string): boolean {
    const parts = cron.split(' ');
    if (parts.length < 5) return false;
    const [minute, hour, day, month, dow] = parts;
    const date = new Date();
    return (minute === '*' || parseInt(minute) === date.getMinutes()) &&
           (hour === '*' || parseInt(hour) === date.getHours()) &&
           (day === '*' || parseInt(day) === date.getDate()) &&
           (month === '*' || parseInt(month) === date.getMonth() + 1) &&
           (dow === '*' || parseInt(dow) === date.getDay());
  }

  async createRule(data: { tenant_id: number; name: string; trigger_type: string; trigger_config: string; action_type: string; action_config: string; timezone?: string; created_by?: number }): Promise<any> {
    const result = await db.run(`INSERT INTO automations (tenant_id, name, trigger_type, trigger_config, action_type, action_config, timezone, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [data.tenant_id, data.name, data.trigger_type, data.trigger_config, data.action_type, data.action_config, data.timezone || 'Asia/Tashkent', data.created_by || 1]);
    await cache.invalidate(`tenant:${data.tenant_id}:automation`);
    return { success: true, id: result.lastInsertRowid };
  }

  async deleteRule(id: number, tenantId: number): Promise<any> {
    await db.run(`DELETE FROM automations WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    await cache.invalidate(`tenant:${tenantId}:automation`);
    return { success: true };
  }
}

export const automationEngine = new AutomationEngine();
