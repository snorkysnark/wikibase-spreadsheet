export interface SparqlQueryDesc {
  isInstanceProp: string;
  parent: string;
  properties: string[];
}

export function buildSparqlQuery(desc: SparqlQueryDesc) {
  const fields = ["?item", ...desc.properties.map((prop) => `?${prop}`)];

  const statements = [
    `?item wdt:${desc.isInstanceProp} wd:${desc.parent}`,
    ...desc.properties
      .filter((prop) => prop !== "label" && prop !== "description")
      .map((prop) => `wdt:${prop} ?${prop}`),
  ];

  return `SELECT ${fields.join(" ")} WHERE {
    ${statements.join("; ")} .
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "en".
      ?item rdfs:label ?label .
      ?item schema:description ?description .
    }
  }`;
}
