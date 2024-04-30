import { produce } from "immer";
import { sparqlQuery } from "./wikibase/sparql";

export interface SparqlQueryDesc {
  isInstanceProp: string;
  parent: string;
  properties: string[];
}

function buildItemQuery(desc: SparqlQueryDesc) {
  const fields = [
    "?item",
    "?label",
    ...desc.properties.map((prop) => [`?id${prop}`, `?${prop}`]),
  ].flat();

  const statements = [
    `?item wdt:${desc.isInstanceProp} wd:${desc.parent}`,
    ...desc.properties.map((prop) => {
      // item -> statement -> value
      return `OPTIONAL { ?item p:${prop} ?id${prop} . ?id${prop} ps:${prop} ?${prop} }`;
    }),
  ];

  return `SELECT ${fields.join(" ")} WHERE {
    ${statements.join("\n")} .
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "en".
      ?item rdfs:label ?label .
    }
  }`;
}

export interface LocalRow {
  itemId: number | null;
  label: { value: string; originalValue?: string };
  properties: { [id: string]: LocalProperty };
  deleted?: boolean;
}

export interface LocalProperty {
  guid: string | null;
  value: string | null;
  originalValue?: string;
}

function lastUriPart(uri: string): string {
  const match = /\/([^\/]+)$/.exec(uri);
  if (match) {
    return match[1];
  }
  throw new Error("Invalid uri: " + uri);
}

function itemIdFromUri(uri: string): number {
  const match = /Q(\d+)$/.exec(uri);
  if (match) {
    return +match[1];
  }
  throw new Error("Invalid uri: " + uri);
}

export async function loadTableFromQuery(
  desc: SparqlQueryDesc
): Promise<LocalRow[]> {
  return sparqlQuery(buildItemQuery(desc)).then((json) => {
    const properties = json.head.vars.filter((name) => name.startsWith("P"));

    const rows = json.results.bindings.map((binding) => ({
      itemId: itemIdFromUri(binding.item.value),
      label: { value: binding.label.value },
      properties: Object.fromEntries(
        properties.map((propertyId) => {
          const propertyObject = binding[propertyId];

          return [
            propertyId,
            propertyObject
              ? {
                  guid: lastUriPart(binding["id" + propertyId].value),
                  value: propertyObject.value,
                }
              : { guid: null, value: null },
          ];
        })
      ),
    }));

    return rows;
  });
}

export type WhereFilter = [path: string[], value: any][];
export type LocalTableAction =
  | { action: "set"; value: LocalRow[] | null }
  | {
      action: "updateAt";
      row: number;
      updater: (value: LocalRow) => LocalRow;
    }
  | {
      action: "updateWhere";
      filter: WhereFilter;
      updater: (value: LocalRow) => LocalRow;
    };

function objectValueAtPath(path: string[], obj: object): any {
  let current: any = obj;

  for (const field of path) {
    if (field in current) {
      current = current[field];
    } else {
      return undefined;
    }
  }

  return current;
}

function matchesFilter(row: object, filter: WhereFilter): boolean {
  for (const [path, value] of filter) {
    if (objectValueAtPath(path, row) !== value) return false;
  }
  return true;
}

export function localTableReducer(
  state: LocalRow[] | null,
  action: LocalTableAction
): LocalRow[] | null {
  switch (action.action) {
    case "set":
      return action.value;
    case "updateAt":
      if (state === null) return null;
      return [
        ...state.slice(0, action.row),
        action.updater(state[action.row]),
        ...state.slice(action.row + 1),
      ];
    case "updateWhere":
      if (state === null) return null;
      return state.map((row) =>
        matchesFilter(row, action.filter) ? action.updater(row) : row
      );
  }
}
