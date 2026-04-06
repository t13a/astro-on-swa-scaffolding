import { apiClient } from "../lib/api-client.js";
import type {
  DataGridField,
  InferRecord,
  InferEditableRecord,
  DataGridConfig,
} from "./DataGrid.js";

const fields = [
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
] as const satisfies DataGridField<string>[];

export type Announcement = InferRecord<typeof fields>;
export type EditableAnnouncement = InferEditableRecord<typeof fields>;

export const config = {
  labels: {
    singular: "Announcement",
    prural: "Announcements",
  },
  fields,
  idField: "id",
  onRead,
  onCreate,
  onUpdate,
  onDelete,
} satisfies DataGridConfig<typeof fields>;

async function onRead() {
  const res = await apiClient.management.announcements.$get();
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}

async function onCreate(record: EditableAnnouncement) {
  const res = await apiClient.management.announcements.$post({
    json: record,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}

async function onUpdate(id: number, record: EditableAnnouncement) {
  const res = await apiClient.management.announcements[":id"].$put({
    param: { id: String(id) },
    json: record,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}

async function onDelete(id: number) {
  const res = await apiClient.management.announcements[":id"].$delete({
    param: { id: String(id) },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
}
