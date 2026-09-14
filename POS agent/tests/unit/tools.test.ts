import { toolRegistry } from '../../src/modules/tools/tools.registry';
import { db } from '../../src/config/database';

describe('Tool Registry', () => {
  test('should have read tools registered', () => {
    const readTools = toolRegistry.getReadTools();
    expect(readTools.length).toBeGreaterThan(0);
    readTools.forEach(t => expect(t.type).toBe('read'));
  });

  test('should have write tools registered', () => {
    const writeTools = toolRegistry.getWriteTools();
    expect(writeTools.length).toBeGreaterThan(0);
    writeTools.forEach(t => expect(t.type).toBe('write'));
  });

  test('should execute read tools', async () => {
    const result = await toolRegistry.execute('get_sales_summary', { period: 'today' }, 1, 'test_001');
    expect(result).toBeDefined();
  });

  test('should return error for unknown tool', async () => {
    const result = await toolRegistry.execute('nonexistent_tool', {}, 1, 'test_002');
    expect(result.success).toBe(false);
  });

  test('read tools should not require confirmation', () => {
    const readTools = toolRegistry.getReadTools();
    readTools.forEach(t => expect(t.requireConfirmation).toBe(false));
  });
});
