import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import { toTabulatorColumns, type DataGridConfig } from "../lib/data-grid.js";

export abstract class DataGridComponent extends HTMLElement {
  abstract readonly config: DataGridConfig;

  private table!: Tabulator;
  private dialog!: HTMLDialogElement;
  private form!: HTMLFormElement;
  private editingId: number | null = null;

  connectedCallback() {
    this.dialog = this.querySelector("dialog")!;
    this.form = this.querySelector("dialog form")!;

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

    this.loadData();

    this.querySelector("button.add")!.addEventListener("click", () =>
      this.openAdd(),
    );

    this.form
      .querySelector('menu button[type="button"]')!
      .addEventListener("click", () => this.dialog.close());

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveForm();
    });
  }

  private async loadData() {
    const records = await this.config.onRead();
    if (records) {
      this.table.setData(records);
    }
  }

  private openAdd() {
    this.form.reset();
    this.editingId = null;
    this.dialog.querySelector("h3")!.textContent =
      `New ${this.config.labels.singular}`;
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
    this.dialog.querySelector("h3")!.textContent =
      `Edit ${this.config.labels.singular}`;
    this.dialog.showModal();
  }

  private async saveForm() {
    const payload: Record<string, string | boolean | number> = {};
    for (const field of this.config.fields) {
      if (field.editable === false) continue;
      const el = this.form.elements.namedItem(field.key)!;
      payload[field.key] =
        field.type === "checkbox"
          ? (el as HTMLInputElement).checked
          : (el as HTMLInputElement).value;
    }
    const result =
      this.editingId != null
        ? await this.config.onUpdate(this.editingId, payload)
        : await this.config.onCreate(payload);
    if (!result) {
      alert("Failed to save data.");
      return;
    }
    this.dialog.close();
    await this.loadData();
  }

  private async doDelete(id: number) {
    if (!confirm("Delete this record?")) return;
    const result = await this.config.onDelete(id);
    if (!result) {
      alert("Failed to delete");
      return;
    }
    await this.loadData();
  }
}
