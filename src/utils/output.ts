import Table from "cli-table3";

export function outputResult<T>(data: T, jsonMode: boolean, tableFormatter?: (data: T) => void): void {
  if (jsonMode) {
    console.log(JSON.stringify({ success: true, data }, null, 2));
  } else if (tableFormatter) {
    tableFormatter(data);
  } else {
    console.log(data);
  }
}

export function outputError(message: string, jsonMode: boolean): void {
  if (jsonMode) {
    console.error(JSON.stringify({ success: false, error: message }));
  } else {
    console.error(`Error: ${message}`);
  }
  process.exit(1);
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function createTable(head: string[], colWidths?: number[]): Table.Table {
  const opts: Table.TableConstructorOptions = { head, style: { head: ["cyan"] } };
  if (colWidths) opts.colWidths = colWidths;
  return new Table(opts);
}
