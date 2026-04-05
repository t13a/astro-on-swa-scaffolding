export interface DataGridField {
  key: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "hidden";
  required?: boolean;
}
