import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AutomationContext, AutomationRule } from '@/lib/automation/engine'

// Mock client-logger
vi.mock('@/lib/client-logger', () => ({
  createClientLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

// We test matchesConditions and the protection logic by testing executeAutomations
// with a mocked supabase client

function createMockSupabase(rules: AutomationRule[] = []) {
  const insertFn = vi.fn().mockResolvedValue({ error: null })
  const updateEqFn = vi.fn().mockResolvedValue({ error: null })
  const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn })

  return {
    client: {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'automation_rules') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: rules,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'automation_executions') {
          return { insert: insertFn }
        }
        if (table === 'notifications' || table === 'follow_up_reminders') {
          return { insert: insertFn }
        }
        if (table === 'leads') {
          return { update: updateFn }
        }
        return { insert: insertFn }
      }),
    },
    insertFn,
    updateFn,
    updateEqFn,
  }
}

describe('automation engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty results when no rules exist', async () => {
    const { executeAutomations } = await import('@/lib/automation/engine')
    const { client } = createMockSupabase([])

    const ctx: AutomationContext = {
      trigger: 'lead_created',
      leadId: 'lead-1',
      leadData: { first_name: 'Ahmed' },
      userId: 'user-1',
    }

    const results = await executeAutomations(ctx, client as any)
    expect(results).toEqual([])
  })

  it('executes matching rules and returns results', async () => {
    const { executeAutomations } = await import('@/lib/automation/engine')

    const rule: AutomationRule = {
      id: 'rule-1',
      name: 'Notify on new lead',
      trigger_type: 'lead_created',
      trigger_conditions: {},
      action_type: 'create_notification',
      action_config: { title: 'New lead: {lead_name}', body: 'A new lead was created' },
      is_active: true,
      priority: 1,
    }
    const { client } = createMockSupabase([rule])

    const ctx: AutomationContext = {
      trigger: 'lead_created',
      leadId: 'lead-1',
      leadData: { first_name: 'Ahmed', last_name: 'Ali', assigned_to: 'user-1' },
      userId: 'user-1',
    }

    const results = await executeAutomations(ctx, client as any)
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('success')
    expect(results[0].ruleName).toBe('Notify on new lead')
  })

  it('skips rules whose conditions do not match', async () => {
    const { executeAutomations } = await import('@/lib/automation/engine')

    const rule: AutomationRule = {
      id: 'rule-1',
      name: 'Notify on stage change to enrolled',
      trigger_type: 'stage_change',
      trigger_conditions: { new_stage: 'enrolled' },
      action_type: 'create_notification',
      action_config: { title: 'Enrolled!', body: 'Student enrolled' },
      is_active: true,
      priority: 1,
    }
    const { client } = createMockSupabase([rule])

    const ctx: AutomationContext = {
      trigger: 'stage_change',
      leadId: 'lead-1',
      leadData: { first_name: 'Ahmed', assigned_to: 'user-1' },
      userId: 'user-1',
      metadata: { new_stage: 'contacted', old_stage: 'new' },
    }

    const results = await executeAutomations(ctx, client as any)
    expect(results).toHaveLength(0)
  })

  it('respects max depth limit', async () => {
    const { executeAutomations } = await import('@/lib/automation/engine')
    const { client } = createMockSupabase([])

    const ctx: AutomationContext = {
      trigger: 'lead_created',
      leadId: 'lead-depth-test',
      leadData: {},
    }

    // Depth >= 3 should return empty
    const results = await executeAutomations(ctx, client as any, 3)
    expect(results).toEqual([])
  })

  it('executes assign_lead action', async () => {
    const { executeAutomations } = await import('@/lib/automation/engine')

    const rule: AutomationRule = {
      id: 'rule-assign',
      name: 'Auto-assign',
      trigger_type: 'lead_created',
      trigger_conditions: {},
      action_type: 'assign_lead',
      action_config: { agent_id: 'agent-1' },
      is_active: true,
      priority: 1,
    }
    const { client, updateEqFn } = createMockSupabase([rule])

    const ctx: AutomationContext = {
      trigger: 'lead_created',
      leadId: 'lead-assign',
      leadData: { first_name: 'Test' },
      userId: 'user-1',
    }

    const results = await executeAutomations(ctx, client as any)
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('success')
    expect(results[0].result?.assigned_to).toBe('agent-1')
  })

  it('handles action failure gracefully', async () => {
    const { executeAutomations } = await import('@/lib/automation/engine')

    const rule: AutomationRule = {
      id: 'rule-fail',
      name: 'Assign without agent_id',
      trigger_type: 'lead_created',
      trigger_conditions: {},
      action_type: 'assign_lead',
      action_config: {}, // missing agent_id
      is_active: true,
      priority: 1,
    }
    const { client } = createMockSupabase([rule])

    const ctx: AutomationContext = {
      trigger: 'lead_created',
      leadId: 'lead-fail',
      leadData: {},
      userId: 'user-1',
    }

    const results = await executeAutomations(ctx, client as any)
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('failed')
    expect(results[0].error).toContain('agent_id')
  })
})
