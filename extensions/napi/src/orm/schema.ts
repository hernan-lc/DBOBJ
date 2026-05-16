export enum DataType {
  Integer = 0,
  Float = 1,
  String = 2,
  Boolean = 3,
  Blob = 4,
  Json = 5,
  ArrayString = 6,
  ArrayI64 = 7,
  ArrayF64 = 8
}

export type ColumnType = DataType;

export interface Column<T = any> {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  notNull?: boolean;
  _type: T; // Phantom type for inference
}

export type TableConfig = Record<string, Column>;

export class Table<T extends TableConfig> {
  constructor(public name: string, public columns: T) {}
}

export function sqliteTable<T extends Record<string, any>>(
  name: string,
  columns: { [K in keyof T]: Column<T[K]> }
): Table<{ [K in keyof T]: Column<T[K]> }> {
  return new Table(name, columns);
}

// Column Helpers
export function integer(name: string): { primaryKey: () => Column<number>; notNull: () => Column<number> } & Column<number> {
  const col: any = { name, type: DataType.Integer, _type: 0 as number };
  col.primaryKey = () => ({ ...col, primaryKey: true });
  col.notNull = () => ({ ...col, notNull: true });
  return col;
}

export function text(name: string): { notNull: () => Column<string> } & Column<string> {
  const col: any = { name, type: DataType.String, _type: "" as string };
  col.notNull = () => ({ ...col, notNull: true });
  return col;
}

export function boolean(name: string): Column<boolean> {
  return { name, type: DataType.Boolean, _type: false as boolean };
}

export function real(name: string): Column<number> {
  return { name, type: DataType.Float, _type: 0.0 as number };
}

export function blob(name: string): Column<Uint8Array> {
  return { name, type: DataType.Blob, _type: new Uint8Array() };
}
