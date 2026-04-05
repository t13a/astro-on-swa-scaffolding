import type { DataGridField } from "../lib/data-grid.js";

export const fields: DataGridField[] = [
  { key: "id", label: "ID", type: "hidden", width: 60 },
  { key: "title", label: "Title", type: "text", required: true },
  { key: "body", label: "Body", type: "textarea", required: true },
  { key: "published", label: "Published", type: "checkbox", width: 100 },
  { key: "createdBy", label: "Created By", type: "text", editable: false },
  { key: "createdAt", label: "Created At", type: "datetime", editable: false },
];
