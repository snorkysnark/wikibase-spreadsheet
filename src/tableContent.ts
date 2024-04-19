import { TableStructure } from "./structure";
import {
  createClaim,
  editEntity,
  getClaims,
  setClaimValue,
  sparqlQuery,
} from "./wikibase";

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
  changed: { [id: string]: ItemModifications };
  added: ItemModifications[];
  deleted: string[];
}

export interface ItemModifications {
  label?: string;
  properties: { [id: string]: string };
}

export async function updateChanged(
  itemId: string,
  changes: ItemModifications
) {
  if (changes.label !== undefined) {
    await editEntity({
      id: itemId,
      data: { labels: { en: { language: "en", value: changes.label } } },
    });
  }

  const { claims } = await getClaims(itemId);
  for (const [propertyId, value] of Object.entries(changes.properties)) {
    const claimId = claims[propertyId]?.[0].id;
    if (claimId) {
      await setClaimValue(claimId, propertyId, value);
    } else {
      await createClaim(itemId, propertyId, value);
    }
  }
}

export async function uploadNewItem(
  item: ItemModifications,
  isInstanceProp: string,
  parentItem: string
) {
  const entityData: any = {};

  if (item.label !== undefined) {
    entityData.labels = { en: { language: "en", value: item.label } };
  }

  const claims: any = Object.entries(item.properties).map(
    ([property, value]) => ({
      mainsnak: {
        snaktype: "value",
        property,
        datavalue: { value, type: "string" },
      },
      type: "statement",
      rank: "normal",
    })
  );
  claims.push({
    mainsnak: {
      snaktype: "value",
      property: isInstanceProp,
      datavalue: {
        value: {
          "entity-type": "item",
          "numeric-id": +/(\d+)$/.exec(parentItem)![1],
        },
        type: "wikibase-entityid",
      },
    },
    type: "statement",
    rank: "normal",
  });

  entityData.claims = claims;

  await editEntity({ new: "item", data: entityData });
}
