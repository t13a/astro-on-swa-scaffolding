import type { ColumnDefinition } from "tabulator-tables";

export interface DataGridField<K extends string> {
  readonly key: K;
  readonly label: string;
  readonly type: "text" | "textarea" | "checkbox" | "hidden" | "datetime";
  readonly required?: boolean;
  readonly editable?: boolean;
  readonly width?: number;
}

export function toTabulatorColumns<K extends string>(
  fields: DataGridField<K>[],
): ColumnDefinition[] {
  return fields.map((f) => {
    const col: ColumnDefinition = { title: f.label, field: f.key };
    if (f.width) col.width = f.width;
    if (f.type === "checkbox") col.formatter = "tickCross";
    if (f.type === "datetime") {
      col.formatter = (cell) =>
        new Date(cell.getValue() as string).toLocaleString();
    }
    return col;
  });
}

type FieldValueType = {
  text: string;
  textarea: string;
  checkbox: boolean;
  hidden: number;
  datetime: string;
};

export type InferRecord<F extends DataGridField<string>[]> = {
  [P in F[number] as P["key"]]: FieldValueType[P["type"]];
};

export type InferEditableRecord<F extends DataGridField<string>[]> = {
  [P in F[number] as P extends { editable: false }
    ? never
    : P extends { type: "hidden" }
      ? never
      : P["key"]]: FieldValueType[P["type"]];
};

export interface DataGridConfig<
  F extends DataGridField<string>[] = DataGridField<string>[],
> {
  labels: {
    singular: string;
    prural: string;
  };
  fields: F;
  idField: F[number]["key"];
  onRead: () => Promise<InferRecord<F>[] | false>;
  onCreate: (record: InferEditableRecord<F>) => Promise<InferRecord<F> | false>;
  onUpdate: (
    id: number,
    record: InferEditableRecord<F>,
  ) => Promise<InferRecord<F> | false>;
  onDelete: (id: number) => Promise<boolean>;
}
