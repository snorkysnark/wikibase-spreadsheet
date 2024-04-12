import { TableStructure } from "./structure";
import { sparqlQuery, editEntity, getClaims, setClaimValue } from "./wikibase";

export interface TableRows {
  rowHeaders: string[];
  rows: string[][];
}

export async function queryRows(
  isInstanceProp: string,
  tableStructure: TableStructure<string>
): Promise<TableRows> {
  const result = await sparqlQuery({
    isInstanceProp,
    parent: tableStructure.parentItem,
    properties: tableStructure.fields.map((field) => field.property),
  });

  const rowHeaders = [];
  const rows = [];

  const bindingNames: string[] = result.head.vars;

  for (const binding of result.results.bindings) {
    const fullRow = bindingNames.map((name) => binding[name]?.value ?? null);
    const uri = fullRow[0];
    const row = fullRow.splice(1, fullRow.length);

    const uriMatch = /\/(\w+)$/.exec(uri);
    if (!uriMatch) {
      throw new Error("Unexpected uri: " + uri);
    }

    rowHeaders.push(uriMatch[1]);
    rows.push(row);
  }

  return { rowHeaders, rows };
}

export interface TableModifications {
  changed: any;
  added: any[];
  deleted: string[];
}

export function applyModificationsTasks(
  modifications: TableModifications,
  isInstanceProp: string,
  parentId: string
): UploadTask[] {
  const tasks: UploadTask[] = [];

  for (const [item, fields] of Object.entries(modifications.changed)) {
    tasks.push(new UpdateTask(item, fields));
  }
  tasks.push(
    ...modifications.added.map(
      (fields) => new CreateTask({ ...fields, [isInstanceProp]: parentId })
    )
  );

  return tasks;
}

export abstract class UploadTask {
  abstract run(): Promise<void>;
  abstract get description(): string;
}

// Shitty, I know
function createEntityData(fields: any): object | null {
  let data: any = null;

  if (fields.label !== undefined) {
    if (!data) data = {};
    data.labels = { en: { language: "en", value: fields.label } };
  }
  if (fields.description !== undefined) {
    if (!data) data = {};
    data.descriptions = { en: { language: "en", value: fields.descriptions } };
  }
  return data;
}

class UpdateTask extends UploadTask {
  itemId: string;
  changedFields: any;

  constructor(itemId: string, changedFields: any) {
    super();
    this.itemId = itemId;
    this.changedFields = changedFields;
  }

  get description(): string {
    return `Updating ${this.itemId}`;
  }

  async run(): Promise<void> {
    const entityData = createEntityData(this.changedFields);
    if (entityData) {
      await editEntity({
        id: this.itemId,
        data: entityData,
      });
    }

    const claimsResponse = await getClaims(this.itemId);
    for (const [property, value] of Object.entries(this.changedFields)) {
      const claimId = claimsResponse.claims[property]?.[0].id;
      console.log(property, claimId);
      if (claimId) {
        await setClaimValue(claimId, property, value as string);
      }
    }
  }
}

class CreateTask extends UploadTask {
  fields: any;

  constructor(fields: any) {
    super();
    this.fields = fields;
  }

  get description(): string {
    return `Creating item "${this.fields.label || ""}"`;
  }

  async run(): Promise<void> {}
}
