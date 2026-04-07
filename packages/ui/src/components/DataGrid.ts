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
    if (f.type === "checkbox") {
      col.formatter = "tickCross";
      col.headerFilter = "tickCross";
      col.headerFilterParams = { tristate: true };
      col.headerFilterFunc = "=";
    } else if (f.type === "number") {
      col.headerFilter = "number";
      col.headerFilterFunc = "=";
    } else if (f.type === "datetime") {
      col.formatter = (cell) =>
        new Date(cell.getValue() as string).toLocaleString();
      col.headerFilter = "input";
      col.headerFilterFunc = "like";
    } else {
      col.headerFilter = "input";
      col.headerFilterFunc = "like";
    }
    return col;
  });
}

function parseFieldValue(
  field: DataGridField<string>,
  e: Element,
): string | boolean | number {
  if (field.type === "checkbox") {
    return (e as HTMLInputElement).checked;
  }
  if (field.type === "number") {
    return Number((e as HTMLInputElement).value) || 0;
  }
  return (e as HTMLInputElement | HTMLTextAreaElement).value;
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

export interface DataGridQuery {
  page: number;
  size: number;
  sort: { field: string; dir: "asc" | "desc" }[];
  filter: { field: string; type: string; value: string | number | boolean }[];
}

export interface DataGridPage<T> {
  data: T[];
  last_page: number;
}

export interface DataGridConfig<
  F extends DataGridField<string>[] = DataGridField<string>[],
> {
  labels: {
    singular: string;
    prural: string;
  };
  fields: F;
  idField: F[number]["key"];
}

export interface DataGridImplementor<
  F extends DataGridField<string>[] = DataGridField<string>[],
> {
  onRead(query: DataGridQuery): Promise<DataGridPage<InferRecord<F>>>;
  onCreate(record: InferEditableRecord<F>): Promise<InferRecord<F>>;
  onUpdate(id: number, record: InferEditableRecord<F>): Promise<InferRecord<F>>;
  onDelete(id: number): Promise<void>;
}

export abstract class DataGridComponent extends HTMLElement {
  abstract readonly config: DataGridConfig;
  abstract readonly implementor: DataGridImplementor;

  private table!: Tabulator;
  private addButton!: HTMLButtonElement;
  private body!: HTMLDivElement;
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
  }

  disconnectedCallback() {
    this.table.destroy();
  }

  private bindElements() {
    this.addButton = this.querySelector("button.data-grid-add")!;
    this.body = this.querySelector(".data-grid-body")!;
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
        if (target.dataset.action === "edit") this.handleEdit(row);
        else if (target.dataset.action === "delete")
          this.handleDelete(row[this.config.idField] as number);
      },
    });

    this.table = new Tabulator(this.body, {
      layout: "fitColumns",
      columns,
      pagination: true,
      paginationMode: "remote",
      paginationSize: 20,
      filterMode: "remote",
      sortMode: "remote",
      ajaxURL: "dummy",
      ajaxRequestFunc: (_url, _config, params) => this.load(params),
    });
  }

  private bindEvents() {
    this.addButton.addEventListener("click", () => this.handleAdd());

    this.formCancelButton.addEventListener("click", () => this.dialog.close());

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.save();
    });
  }

  private async load(params: Record<string, unknown>) {
    const query: DataGridQuery = {
      page: (params.page as number) || 1,
      size: (params.size as number) || 20,
      sort: (params.sort as DataGridQuery["sort"]) ?? [],
      filter: ((params.filter as DataGridQuery["filter"]) ?? []).filter(
        (f) => f.value !== "" && f.value != null,
      ),
    };
    return this.implementor.onRead(query);
  }

  private reload() {
    this.table.setPage(this.table.getPage() || 1);
  }

  private async save() {
    const payload: Record<string, string | boolean | number> = {};
    for (const field of this.config.fields) {
      if (field.editable === false) continue;
      const el = this.form.elements.namedItem(field.key) as Element;
      payload[field.key] = parseFieldValue(field, el);
    }
    try {
      if (this.editingId != null) {
        await this.implementor.onUpdate(this.editingId, payload);
      } else {
        await this.implementor.onCreate(payload);
      }
      this.dialog.close();
      this.reload();
    } catch (e) {
      console.error("Failed to save data:", e);
      alert(e instanceof Error ? e.message : "Failed to save data.");
    }
  }

  private handleAdd() {
    this.form.reset();
    this.editingId = null;
    this.dialogHeading.textContent = `New ${this.config.labels.singular}`;
    this.dialog.showModal();
  }

  private handleEdit(row: Record<string, unknown>) {
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

  private async handleDelete(id: number) {
    if (!confirm("Delete this record?")) return;
    try {
      await this.implementor.onDelete(id);
      this.reload();
    } catch (e) {
      console.error("Failed to delete:", e);
      alert(e instanceof Error ? e.message : "Failed to delete.");
    }
  }
}
