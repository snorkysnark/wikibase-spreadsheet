import { editEntity } from "./wikibase";

export abstract class UploadTask {
  abstract get description(): string;
  abstract run(): Promise<void>;
}

export interface PropertyChanges {
  guid: string | null;
  property: string;
  value: string;
}

export interface ItemChanges {
  label?: string;
  properties: PropertyChanges[];
}

function normalieGuid(guid: string): string {
  // Sparql query returns itemid-XXXX-XXXX, wbeditentity expects itemid$XXXX-XXXX
  return guid.includes("$") ? guid : guid.replace("-", "$");
}

export class UpdateTask extends UploadTask {
  itemId: string;
  changes: ItemChanges;

  constructor(itemId: string, changes: ItemChanges) {
    super();
    this.itemId = itemId;
    this.changes = changes;
  }

  get description(): string {
    return `Updating ${this.itemId}`;
  }
  async run(): Promise<void> {
    const claims: any[] = [];
    for (const { guid, property, value } of this.changes.properties) {
      claims.push({
        ...(guid && { id: normalieGuid(guid) }),
        mainsnak: {
          snaktype: "value",
          property,
          datavalue: { type: "string", value },
        },
        type: "statement",
        rank: "normal",
      });
    }

    await editEntity({
      id: this.itemId,
      data: {
        ...(this.changes.label && {
          labels: { en: { language: "en", value: this.changes.label } },
        }),
        ...(claims.length > 0 && { claims }),
      },
    });
  }
}
