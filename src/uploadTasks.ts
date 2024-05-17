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
  value: string;
}

export interface ItemChanges {
  label?: string;
  description?: string;
  aliases?: string;
  properties: PropertyChanges[];
}

function prepareGuid(guid: string): string {
  // Sparql query returns itemid-XXXX-XXXX, wbeditentity expects itemid$XXXX-XXXX
  return guid.includes("$") ? guid : guid.replace("-", "$");
}

function toItemData(changes: ItemChanges): any {
  const claims: any[] = [];
  for (const { guid, property, value } of changes.properties) {
    claims.push({
      ...(guid && { id: prepareGuid(guid) }),
      mainsnak: {
        snaktype: "value",
        property,
        datavalue: { type: "string", value },
      },
      type: "statement",
      rank: "normal",
    });
  }

  return {
    ...(changes.label && {
      labels: { en: { language: "en", value: changes.label } },
    }),
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
