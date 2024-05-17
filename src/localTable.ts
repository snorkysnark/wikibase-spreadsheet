import { sparqlQuery } from "./wikibase/sparql";

export interface SparqlQueryDesc {
  isInstanceProp: string;
  parent: string;
  properties: string[];
}

export function propertyToPath(property: string) {
  return property.startsWith("P") ? `properties.${property}.value` : property;
}

function buildItemQuery(desc: SparqlQueryDesc) {
  const fields = desc.properties.flatMap((prop) => {
    return (
      {
        label: "?label",
        description: "?description",
        aliases: "?aliases",
      }[prop] ?? [`?id${prop}`, `?${prop}`]
    );
  });
  const externalProps = desc.properties.filter((prop) => prop.startsWith("P"));

  const statements = [
    `?item wdt:${desc.isInstanceProp} wd:${desc.parent}`,
    ...externalProps.map((prop) => {
      // item -> statement -> value
      return `OPTIONAL { ?item p:${prop} ?id${prop} . ?id${prop} ps:${prop} ?${prop} }`;
    }),
  ];

  return `SELECT ?item ${fields.join(" ")} WHERE {
    ${statements.join("\n")} .
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "en".
      ?item rdfs:label ?label .
      ?item schema:description ?description .
      ?item skos:altLabel ?aliases .
    }
  } ORDER BY ?item`;
}

export interface LocalRow {
  itemId: string | null;
  label?: string;
  description?: string;
  aliases?: string;
  properties: { [id: string]: LocalProperty };
}

export interface LocalProperty {
  guid: string | null;
  value: string | null;
}

export function lastUriPart(uri: string): string {
  const match = /\/([^\/]+)$/.exec(uri);
  if (match) {
    return match[1];
  }
  throw new Error("Invalid uri: " + uri);
}

export function itemIdFromUri(uri: string): number {
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
        itemId: lastUriPart(binding.item.value),
        label: binding.label?.value,
        description: binding.description?.value,
        aliases: binding.aliases?.value,
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
