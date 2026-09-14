declare module 'better-sqlite3' {
  class Database {
    constructor(path: string);
    pragma(command: string): void;
    prepare(sql: string): Statement;
    close(): void;
  }
  interface Statement {
    all(...params: any[]): any[];
    get(...params: any[]): any;
    run(...params: any[]): any;
  }
}

declare module 'pg' {
  class Pool {
    constructor(options: any);
    query(sql: string, params?: any[]): Promise<any>;
    connect(): Promise<any>;
    end(): Promise<void>;
  }
}

declare module 'ioredis' {
  class Redis {
    constructor(options?: any);
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    keys(pattern: string): Promise<string[]>;
    del(...keys: string[]): Promise<number>;
    ping(): Promise<string>;
    on(event: string, callback: Function): void;
    status: string;
  }
}

declare module 'node-cron' {
  function cron(pattern: string, callback: Function): any;
  function stop(): void;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    PORT: string;
    BOT_TOKEN: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    ANTHROPIC_API_KEY: string;
    GEMINI_API_KEY: string;
    POS_API_URL: string;
    POS_API_KEY: string;
    JWT_SECRET: string;
    DEFAULT_LANGUAGE: string;
    DEFAULT_CURRENCY: string;
    DEFAULT_TIMEZONE: string;
    AI_PROVIDER: string;
    LOG_LEVEL: string;
    FRONTEND_URL: string;
    WORKER_CONCURRENCY: string;
    SCHEDULER_INTERVAL_MS: string;
    AUTOMATION_MAX_RULES_PER_TENANT: string;
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX: string;
    AGENT_MAX_TOKENS: string;
    AGENT_TEMPERATURE: string;
    REPORT_DIR: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    DEFAULT_TENANT_NAME: string;
    TENANT_AUTO_CREATE: string;
    HEALTH_CHECK_INTERVAL_MS: string;
    DEAD_LETTER_MAX_RETRIES: string;
  }
}
