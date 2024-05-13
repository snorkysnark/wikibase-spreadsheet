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
  } ORDER BY ?item`;
}

export interface LocalRow {
  itemId: number | null;
  label: { value: string };
  properties: { [id: string]: LocalProperty };
}

export interface LocalProperty {
  guid: string | null;
  value: string | null;
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
  const responseJson = await sparqlQuery(buildItemQuery(desc));
  const properties = responseJson.head.vars.filter((name) =>
    name.startsWith("P")
  );

  const rows: LocalRow[] = [];
  let lastItemUri: string | null = null;

  for (const binding of responseJson.results.bindings) {
    // Skip duplicates (results are already sorted by ?item)
    if (binding.item.value !== lastItemUri) {
      rows.push({
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
      });
    }

    lastItemUri = binding.item.value;
  }

  return rows;
}
