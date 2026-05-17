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

  getDefinitions(): any[] {
    return Object.values(this.columns).map(col => ({
      name: col.name,
      dataType: col.type,
      nullable: !col.notNull
    }));
  }
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

export interface Relation<T extends Table<any> = Table<any>> {
  target: T;
  type: "one" | "many";
  foreignKey?: string;
}

export function relations<T extends Table<any>>(
  table: T,
  relationsConfig: (helpers: {
    one: <U extends Table<any>>(target: U, config?: { fields: Column<any>[], references: Column<any>[] }) => Relation<U>,
    many: <U extends Table<any>>(target: U) => Relation<U>
  }) => Record<string, Relation>
) {
  const helpers = {
    one: <U extends Table<any>>(target: U, config?: { fields: Column<any>[], references: Column<any>[] }) => ({
      target,
      type: "one" as const,
      foreignKey: config?.fields[0]?.name
    }),
    many: <U extends Table<any>>(target: U) => ({
      target,
      type: "many" as const
    })
  };
  (table as any)._relations = relationsConfig(helpers);
  return table;
}
