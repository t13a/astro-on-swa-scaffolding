import type { DataGridConfig } from "./DataGrid.js";

export const config = {
  labels: {
    singular: "Announcement",
    prural: "Announcements",
  },
  fields: [
    { key: "id", label: "ID", type: "number", editable: false, width: 60 },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "body", label: "Body", type: "textarea", required: true },
    { key: "published", label: "Published", type: "checkbox", width: 100 },
    { key: "createdBy", label: "Created By", type: "text", editable: false },
    {
      key: "createdAt",
      label: "Created At",
      type: "datetime",
      editable: false,
    },
  ],
  idField: "id",
} as const satisfies DataGridConfig;
