import { makeUuid } from "./util";
import { deleteItem, editEntity } from "./wikibase";

export abstract class NamedTask {
  description: string;

  constructor(description: string) {
    this.description = description;
  }

  abstract run(): Promise<void>;
}

export interface PropertyChanges {
  guid?: string | null;
  property: string;
  value: string | null;
  datatype?: string;
}

export interface ItemChanges {
  label?: string | null;
  description?: string | null;
  aliases?: string | null;
  properties: PropertyChanges[];
}

function prepareGuid(guid: string): string {
  // Sparql query returns itemid-XXXX-XXXX, wbeditentity expects itemid$XXXX-XXXX
  return guid.includes("$") ? guid : guid.replace("-", "$");
}

function toDatavalue(value: any, datatype: string | undefined): any {
  switch (datatype) {
    case "quantity":
      // Other units (percent, kilometer, etc.) currently unsupported
      return { type: datatype, value: { amount: value, unit: "1" } };
    default:
      return { type: "string", value: value };
  }
}

function isEmptyValue(value: any): boolean {
  return value === "" || value === null || value === undefined;
}

function toAliasesData(aliases: string | null): any {
  const aliasList = aliases
    ? aliases.split(", ").map((alias) => ({ language: "en", value: alias }))
    : [];

  return { aliases: { en: aliasList } };
}

function toItemData(changes: ItemChanges): any {
  const claims: any[] = [];
  for (const { guid, property, value, datatype } of changes.properties) {
    claims.push({
      ...(guid && { id: prepareGuid(guid) }),
      ...(isEmptyValue(value) && guid
        ? { remove: ":" }
        : {
            mainsnak: {
              snaktype: "value",
              property,
              datavalue: toDatavalue(value, datatype),
            },
            type: "statement",
            rank: "normal",
          }),
    });
  }

  return {
    ...(changes.label && {
      labels: { en: { language: "en", value: changes.label } },
    }),
    ...(changes.description && {
      descriptions: { en: { language: "en", value: changes.description } },
    }),
    ...(changes.aliases !== undefined && toAliasesData(changes.aliases)),
    ...(claims.length > 0 && { claims }),
  };
}

export class UpdateTask extends NamedTask {
  itemId: string;
  changes: ItemChanges;

  constructor(itemId: string, changes: ItemChanges) {
    super(`Updating ${itemId}`);
    this.itemId = itemId;
    this.changes = changes;
  }

  async run(): Promise<void> {
    await editEntity({
      id: this.itemId,
      data: toItemData(this.changes),
    });
  }
}

export class CreationTask extends NamedTask {
  isInstanceProp: string;
  parentItem: number;
  changes: ItemChanges;

  constructor(
    changes: ItemChanges,
    isInstanceProp: string,
    parentItem: number
  ) {
    if (!changes.label) {
      changes.label = makeUuid();
    }

    super(`Creating item ${changes.label}`);
    this.changes = changes;
    this.isInstanceProp = isInstanceProp;
    this.parentItem = parentItem;
  }

  async run(): Promise<void> {
    const data = toItemData(this.changes);

    if (!data.claims) data.claims = [];
    data.claims.push({
      mainsnak: {
        snaktype: "value",
        property: this.isInstanceProp,
        datavalue: {
          type: "wikibase-entityid",
          value: { ["entity-type"]: "item", "numeric-id": this.parentItem },
        },
      },
      type: "statement",
      rank: "normal",
    });

    await editEntity({
      new: "item",
      data,
    });
  }
}

export class DeletionTask extends NamedTask {
  itemId: string;

  constructor(itemId: string) {
    super(`Deleting ${itemId}`);
    this.itemId = itemId;
  }

  async run(): Promise<void> {
    await deleteItem(this.itemId);
  }
}
