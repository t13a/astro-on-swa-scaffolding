import {
  TabulatorFull as Tabulator,
  type ColumnDefinition,
} from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";

export interface DataGridField<K extends string> {
  readonly key: K;
  readonly label: string;
  readonly type: "text" | "textarea" | "checkbox" | "number" | "datetime";
  readonly required?: boolean;
  readonly editable?: boolean;
  readonly width?: number;
}

function toTabulatorColumns<K extends string>(
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

function parseFieldValue(
  field: DataGridField<string>,
  el: Element,
): string | boolean | number {
  if (field.type === "checkbox") {
    return (el as HTMLInputElement).checked;
  }
  if (field.type === "number") {
    return Number((el as HTMLInputElement).value) || 0;
  }
  return (el as HTMLInputElement | HTMLTextAreaElement).value;
}

type FieldValueType = {
  text: string;
  textarea: string;
  checkbox: boolean;
  number: number;
  datetime: string;
};

export type InferRecord<F extends DataGridField<string>[]> = {
  [P in F[number] as P["key"]]: FieldValueType[P["type"]];
};

export type InferEditableRecord<F extends DataGridField<string>[]> = {
  [P in F[number] as P extends { editable: false }
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
  onRead(): Promise<InferRecord<F>[]>;
  onCreate(record: InferEditableRecord<F>): Promise<InferRecord<F>>;
  onUpdate(
    id: number,
    record: InferEditableRecord<F>,
  ): Promise<InferRecord<F>>;
  onDelete(id: number): Promise<void>;
}

export abstract class DataGridComponent extends HTMLElement {
  abstract readonly config: DataGridConfig;

  private table!: Tabulator;
  private addButton!: HTMLButtonElement;
  private dialog!: HTMLDialogElement;
  private dialogHeading!: HTMLHeadingElement;
  private form!: HTMLFormElement;
  private formCancelButton!: HTMLButtonElement;
  private formSaveButton!: HTMLButtonElement;
  private editingId: number | null = null;

  connectedCallback() {
    this.bindElements();
    this.initTable();
    this.bindEvents();
    this.loadData();
  }

  private bindElements() {
    this.addButton = this.querySelector("button.data-grid-add")!;
    this.dialog = this.querySelector("dialog")!;
    this.dialogHeading = this.dialog.querySelector("h3")!;
    this.form = this.querySelector("dialog form")!;
    this.formCancelButton = this.form.querySelector(
      'menu button[type="button"]',
    )!;
    this.formSaveButton = this.form.querySelector(
      'menu button[type="submit"]',
    )!;
  }

  private initTable() {
    const columns = toTabulatorColumns(this.config.fields);
    columns.push({
      title: "",
      formatter() {
        return '<button data-action="edit">Edit</button> <button data-action="delete">Delete</button>';
      },
      width: 150,
      headerSort: false,
      cellClick: (_e, cell) => {
        const target = (_e as unknown as MouseEvent).target as HTMLElement;
        const row = cell.getRow().getData() as Record<string, unknown>;
        if (target.dataset.action === "edit") this.openEdit(row);
        else if (target.dataset.action === "delete")
          this.doDelete(row[this.config.idField] as number);
      },
    });

    this.table = new Tabulator(
      this.querySelector(".data-grid-body") as HTMLElement,
      { layout: "fitColumns", columns },
    );
  }

  private bindEvents() {
    this.addButton.addEventListener("click", () => this.openAdd());

    this.formCancelButton.addEventListener("click", () =>
      this.dialog.close(),
    );

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveForm();
    });
  }

  private async loadData() {
    try {
      const records = await this.config.onRead();
      this.table.setData(records);
    } catch (e) {
      console.error("Failed to load data:", e);
      alert(e instanceof Error ? e.message : "Failed to load data.");
    }
  }

  private openAdd() {
    this.form.reset();
    this.editingId = null;
    this.dialogHeading.textContent = `New ${this.config.labels.singular}`;
    this.dialog.showModal();
  }

  private openEdit(row: Record<string, unknown>) {
    this.editingId = row[this.config.idField] as number;
    for (const field of this.config.fields) {
      if (field.editable === false) continue;
      const el = this.form.elements.namedItem(field.key);
      if (!el) continue;
      if (field.type === "checkbox") {
        (el as HTMLInputElement).checked = row[field.key] as boolean;
      } else {
        (el as HTMLInputElement).value = String(row[field.key]);
      }
    }
    this.dialogHeading.textContent = `Edit ${this.config.labels.singular}`;
    this.dialog.showModal();
  }

  private async saveForm() {
    const payload: Record<string, string | boolean | number> = {};
    for (const field of this.config.fields) {
      if (field.editable === false) continue;
      const el = this.form.elements.namedItem(field.key) as Element;
      payload[field.key] = parseFieldValue(field, el);
    }
    try {
      if (this.editingId != null) {
        await this.config.onUpdate(this.editingId, payload);
      } else {
        await this.config.onCreate(payload);
      }
      this.dialog.close();
      await this.loadData();
    } catch (e) {
      console.error("Failed to save data:", e);
      alert(e instanceof Error ? e.message : "Failed to save data.");
    }
  }

  private async doDelete(id: number) {
    if (!confirm("Delete this record?")) return;
    try {
      await this.config.onDelete(id);
      await this.loadData();
    } catch (e) {
      console.error("Failed to delete:", e);
      alert(e instanceof Error ? e.message : "Failed to delete.");
    }
  }
}
