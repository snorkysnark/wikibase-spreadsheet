import { handleErrors } from "./errors";

const SPARQL_URL = `http://localhost:${
  import.meta.env.VITE_WDQS_FRONTEND_PORT
}/proxy/wdqs/bigdata/namespace/wdq/sparql`;

export interface SparqlResponse {
  head: { vars: string[] };
  results: {
    bindings: SparqlBinding[];
  };
}

export interface SparqlBinding {
  [name: string]: { type: string; value: string; datatype?: string };
}

export async function sparqlQuery(query: string): Promise<SparqlResponse> {
  return handleErrors(
    fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/sparql-results+json" },
    })
  );
}
