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

export interface Column<T = unknown> {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  notNull?: boolean;
  _type: T; // Phantom type for inference
}

export type TableConfig = Record<string, Column<unknown>>;

export class Table<T extends TableConfig> {
  constructor(public name: string, public columns: T) {}
}

export function sqliteTable<T extends Record<string, unknown>>(
  name: string,
  columns: { [K in keyof T]: Column<T[K]> }
): Table<{ [K in keyof T]: Column<T[K]> }> {
  return new Table(name, columns);
}

interface IntegerColumnBuilder extends Column<number> {
  primaryKey: () => IntegerColumnBuilder;
  notNull: () => IntegerColumnBuilder;
}

// Column Helpers
export function integer(name: string): IntegerColumnBuilder {
  const col = {
    name,
    type: DataType.Integer,
    _type: 0 as number,
  } as IntegerColumnBuilder;

  col.primaryKey = () => ({ ...col, primaryKey: true });
  col.notNull = () => ({ ...col, notNull: true });
  return col;
}

interface TextColumnBuilder extends Column<string> {
  notNull: () => TextColumnBuilder;
}

export function text(name: string): TextColumnBuilder {
  const col = {
    name,
    type: DataType.String,
    _type: "" as string
  } as TextColumnBuilder;

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
