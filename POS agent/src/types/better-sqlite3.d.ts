export default class Database {
  constructor(path: string);
  pragma(command: string): void;
  prepare(sql: string): Statement;
  close(): void;
}

export class Statement {
  all(...params: any[]): any[];
  get(...params: any[]): any;
  run(...params: any[]): any;
}
