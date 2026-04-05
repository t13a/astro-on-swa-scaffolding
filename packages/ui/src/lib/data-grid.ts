import type { ColumnDefinition } from "tabulator-tables";

export interface DataGridField {
  key: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "hidden" | "datetime";
  required?: boolean;
  editable?: boolean;
  width?: number;
}

export function toTabulatorColumns(fields: DataGridField[]): ColumnDefinition[] {
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
