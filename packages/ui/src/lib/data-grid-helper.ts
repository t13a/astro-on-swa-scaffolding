import type { ClientResponse } from "hono/client";
import type {
  DataGridField,
  DataGridImplementor,
  DataGridQuery,
  InferRecord,
  InferEditableRecord,
} from "../components/DataGrid.js";

export type GetMethod<F extends DataGridField<string>[]> = (args: {
  query: {
    page: string;
    size: string;
    sort: string;
    filter: string;
  };
}) => Promise<
  ClientResponse<{ data: InferRecord<F>[]; last_page: number }, 200, "json">
>;

export type PostMethod<F extends DataGridField<string>[]> = (args: {
  json: InferEditableRecord<F>;
}) => Promise<ClientResponse<InferRecord<F>, 201, "json">>;

export type PutMethod<F extends DataGridField<string>[]> = (args: {
  param: {
    id: string;
  };
  json: InferEditableRecord<F>;
}) => Promise<
  | ClientResponse<InferRecord<F>, 200, "json">
  | ClientResponse<string, 404, "text">
>;

export type DeleteMethod = (args: {
  param: {
    id: string;
  };
}) => Promise<
  | ClientResponse<{ deleted: true }, 200, "json">
  | ClientResponse<string, 404, "text">
>;

export function createOnReadCallback<F extends DataGridField<string>[]>(
  getMethod: GetMethod<F>,
) {
  return async (query: DataGridQuery) => {
    const res = await getMethod({
      query: {
        page: String(query.page),
        size: String(query.size),
        sort: JSON.stringify(query.sort),
        filter: JSON.stringify(query.filter),
      },
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return await res.json();
  };
}

export function createOnCreateCallback<F extends DataGridField<string>[]>(
  postMethod: PostMethod<F>,
) {
  return async (record: InferEditableRecord<F>) => {
    const res = await postMethod({
      json: record,
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return await res.json();
  };
}

export function createOnUpdateCallback<F extends DataGridField<string>[]>(
  putMethod: PutMethod<F>,
) {
  return async (id: number, record: InferEditableRecord<F>) => {
    const res = await putMethod({
      param: { id: String(id) },
      json: record,
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return await res.json();
  };
}

export function createOnDeleteCallback(
  deleteMethod: DeleteMethod,
) {
  return async (id: number) => {
    const res = await deleteMethod({
      param: { id: String(id) },
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  };
}

export function createImplementor<F extends DataGridField<string>[]>(
  getMethod: GetMethod<F>,
  postMethod: PostMethod<F>,
  putMethod: PutMethod<F>,
  deleteMethod: DeleteMethod,
): DataGridImplementor<F> {
  return {
    onRead: createOnReadCallback(getMethod),
    onCreate: createOnCreateCallback(postMethod),
    onUpdate: createOnUpdateCallback(putMethod),
    onDelete: createOnDeleteCallback(deleteMethod),
  };
}
