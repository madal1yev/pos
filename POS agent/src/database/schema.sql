CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'Asia/Tashkent',
    currency TEXT DEFAULT 'UZS',
    currency_symbol TEXT DEFAULT 'som',
    language TEXT DEFAULT 'uz',
    tier TEXT DEFAULT 'starter',
    max_users INTEGER DEFAULT 5,
    max_automations INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    trial_expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    permissions TEXT DEFAULT '{}',
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    is_system INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    resource TEXT,
    action TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT,
    password_hash TEXT,
    phone TEXT,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS telegram_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id INTEGER NOT NULL,
    telegram_chat_id INTEGER NOT NULL,
    bot_token TEXT,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    is_active INTEGER DEFAULT 1,
    connected_at TEXT DEFAULT (datetime('now')),
    last_interaction_at TEXT,
    UNIQUE(tenant_id, telegram_user_id)
);

CREATE TABLE IF NOT EXISTS pos_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_url TEXT NOT NULL,
    ws_url TEXT,
    api_key TEXT,
    store_id INTEGER,
    is_active INTEGER DEFAULT 1,
    health_status TEXT DEFAULT 'unknown',
    last_checked_at TEXT,
    connected_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    telegram_chat_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    agent_id TEXT,
    status TEXT DEFAULT 'active',
    title TEXT,
    language TEXT DEFAULT 'uz',
    timezone TEXT DEFAULT 'Asia/Tashkent',
    message_count INTEGER DEFAULT 0,
    last_message_at TEXT,
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    UNIQUE(tenant_id, telegram_chat_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK(direction IN ('incoming', 'outgoing')),
    role TEXT DEFAULT 'user',
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK(type IN ('conversation', 'business', 'preference', 'important_fact', 'recent_context')),
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 5,
    tags TEXT DEFAULT '[]',
    source TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT
);

CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    settings TEXT DEFAULT '{}',
    currency TEXT DEFAULT 'UZS',
    timezone TEXT DEFAULT 'Asia/Tashkent',
    language TEXT DEFAULT 'uz',
    default_ai_model TEXT DEFAULT 'gpt-4o-mini',
    auto_report_enabled INTEGER DEFAULT 0,
    report_frequency TEXT DEFAULT 'daily',
    report_time TEXT DEFAULT '22:00',
    low_stock_threshold INTEGER DEFAULT 5,
    notification_preferences TEXT DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    prompt TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    result TEXT,
    error TEXT,
    tool_calls TEXT DEFAULT '[]',
    assigned_to TEXT,
    scheduled_at TEXT,
    executed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    agent_task_id INTEGER REFERENCES agent_tasks(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_type TEXT CHECK(tool_type IN ('read', 'write')),
    input TEXT,
    output TEXT,
    status TEXT DEFAULT 'pending',
    error TEXT,
    execution_time_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_config TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_run_at TEXT,
    next_run_at TEXT,
    run_count INTEGER DEFAULT 0,
    timezone TEXT DEFAULT 'Asia/Tashkent',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automation_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'running',
    result TEXT,
    error TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    channel TEXT DEFAULT 'telegram',
    status TEXT DEFAULT 'pending',
    scheduled_at TEXT,
    sent_at TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    format TEXT DEFAULT 'text',
    data TEXT,
    file_path TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'pending',
    scheduled_at TEXT,
    generated_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    device_info TEXT,
    request_id TEXT,
    tool_name TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    provider TEXT,
    model TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    source TEXT,
    message TEXT,
    severity TEXT DEFAULT 'info',
    metadata TEXT DEFAULT '{}',
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_memories_tenant ON memories(tenant_id, type, importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_conversation ON memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_automations_tenant ON automations(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tenant ON tool_calls(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id, telegram_chat_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reports_tenant ON reports(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_tenant ON agent_tasks(tenant_id, status);
