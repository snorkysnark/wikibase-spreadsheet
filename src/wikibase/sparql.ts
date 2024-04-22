import { handleErrors } from "./errors";

const SPARQL_URL =
  "http://localhost:8834/proxy/wdqs/bigdata/namespace/wdq/sparql";

export interface SparqlQueryDesc {
  isInstanceProp: string;
  parent: string;
  properties: string[];
}

export function buildItemQuery(desc: SparqlQueryDesc) {
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

export async function rawSparqlQuery(
  query: string
): Promise<RawSparqlResponse> {
  return handleErrors(
    fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/sparql-results+json" },
    })
  );
}

export interface RawSparqlResponse {
  head: { vars: string[] };
  results: {
    bindings: RawSparqlBinding[];
  };
}

export interface RawSparqlBinding {
  [name: string]: { type: string; value: string };
}

export interface SparqlTable {
  properties: string[];
  rows: SparqlRow[];
}

export interface SparqlRow {
  item: string;
  label: string;
  properties: { [id: string]: SparqlProperty };
}

export interface SparqlProperty {
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

export async function itemSparqlQuery(
  desc: SparqlQueryDesc
): Promise<SparqlTable> {
  return rawSparqlQuery(buildItemQuery(desc)).then((json) => {
    const properties = json.head.vars.filter((name) => name.startsWith("P"));

    const rows = json.results.bindings.map((binding) => ({
      item: lastUriPart(binding.item.value),
      label: binding.label.value,
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

    return { properties, rows };
  });
}
