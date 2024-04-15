import { SparqlQueryDesc, buildSparqlQuery } from "./sparql";

const BASE_URL = "http://localhost:8030";
const WIKI_URL = BASE_URL + "/wiki";
const API_URL = BASE_URL + "/api.php";
const SPARQL_URL =
  "http://localhost:8834/proxy/wdqs/bigdata/namespace/wdq/sparql";

const CLIENT_URL = "http://localhost:5173";

export class ResponseError extends Error {
  response: Response;

  constructor(response: Response) {
    super(`Bad response: ${response.status}`);
    this.response = response;
  }

  static raiseForStatus(response: Response) {
    if (!response.ok) throw new ResponseError(response);
  }
}

export interface ErrorData {
  error: {
    code: string;
    info: string;
    messages?: {
      name: string;
      parameters: string[];
      html: { ["*"]: string };
    }[];
  };
}

export class WikibaseError extends Error {
  data: ErrorData;

  constructor(data: ErrorData) {
    super(data.error.info || data.error.code || "Unknown error");
    this.data = data;
  }

  public get messages(): string[] {
    return [
      ...(this.data.error.messages?.map((message) => message.html["*"]) || []),
    ];
  }

  static raiseForErrors(data: any) {
    if ("error" in data) throw new WikibaseError(data);
  }
}

export async function fetchLoginToken(): Promise<string> {
  return fetch(
    `${API_URL}?${new URLSearchParams({
      action: "query",
      meta: "tokens",
      type: "login",
      format: "json",
      origin: CLIENT_URL,
    })}`,
    {
      method: "POST",
      credentials: "include",
    }
  )
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json.query.tokens.logintoken;
    });
}

async function fetchCsrfToken(): Promise<string> {
  return fetch(
    `${API_URL}?${new URLSearchParams({
      action: "query",
      meta: "tokens",
      format: "json",
      origin: CLIENT_URL,
    })}`,
    {
      method: "POST",
      credentials: "include",
    }
  )
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json.query.tokens.csrftoken;
    });
}

export async function assertLogin() {
  return fetch(
    `${API_URL}?${new URLSearchParams({
      action: "query",
      assert: "user",
      format: "json",
      origin: CLIENT_URL,
    })}`,
    {
      credentials: "include",
    }
  )
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export interface LoginParams {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginReturnType {
  clientlogin:
    | { status: "PASS"; username: string }
    | { status: "FAIL"; message: string; messagecode: string };
}

export async function login(params: LoginParams): Promise<LoginReturnType> {
  const loginToken = await fetchLoginToken();

  return fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "clientlogin",
      logintoken: loginToken,
      origin: CLIENT_URL,
      loginreturnurl: CLIENT_URL,
      username: params.username,
      password: params.password,
      ...(params.rememberMe && { rememberMe: "1" }),
      format: "json",
    }),
    credentials: "include",
  })
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export async function logout() {
  const csrfToken = await fetchCsrfToken();
  return fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "logout",
      token: csrfToken,
      format: "json",
      origin: CLIENT_URL,
    }),
    credentials: "include",
  })
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export type EntityType = "form" | "item" | "lexeme" | "property" | "sense";

export interface SearchEntitiesParams {
  search: string;
  language?: string;
  type?: EntityType;
  limit?: string;
  continue?: string;
  props?: string;
}

export async function searchEntities(
  params: SearchEntitiesParams
): Promise<any> {
  return fetch(
    `${API_URL}?${new URLSearchParams({
      ...params,
      action: "wbsearchentities",
      language: params.language || "en",
      format: "json",
      origin: CLIENT_URL,
    })}`,
    {
      credentials: "include",
    }
  )
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export interface EditEntityParams {
  id?: string;
  new?: EntityType;
  data: any;
}

export function entityDataEn(values: any) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      { en: { language: "en", value } },
    ])
  );
}

export interface EditEntityData {
  entity: {
    type: EntityType;
    datatype: string;
    id: string;
    labels: {
      en: { language: string; value: string };
    };
    descriptions: {
      en: { language: string; value: string };
    };
  };
}

export async function editEntity(
  params: EditEntityParams
): Promise<EditEntityData> {
  const csrfToken = await fetchCsrfToken();
  return fetch(API_URL, {
    method: "post",
    body: new URLSearchParams({
      action: "wbeditentity",
      token: csrfToken,
      format: "json",
      origin: CLIENT_URL,
      ...(params.id && { id: params.id }),
      ...(params.new && { new: params.new }),
      data: JSON.stringify(params.data),
    }),
    credentials: "include",
  })
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export function getItemUrl(type: EntityType, id: string) {
  return `${WIKI_URL}/${type}:${id}`;
}

export async function sparqlQuery(query: string | SparqlQueryDesc) {
  const queryStr = typeof query === "string" ? query : buildSparqlQuery(query);

  return fetch(`${SPARQL_URL}?query=${encodeURIComponent(queryStr)}`, {
    headers: { Accept: "application/sparql-results+json" },
  })
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export interface GetClaimsResult {
  claims: { [property: string]: { id: string }[] };
}

export async function getClaims(item: string): Promise<GetClaimsResult> {
  return fetch(
    `${API_URL}?${new URLSearchParams({
      action: "wbgetclaims",
      entity: item,
      format: "json",
      origin: CLIENT_URL,
    })}`,
    {
      credentials: "include",
    }
  )
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export async function setClaimValue(
  guid: string,
  property: string,
  value: string
) {
  const csrfToken = await fetchCsrfToken();

  return fetch(API_URL, {
    method: "post",
    body: new URLSearchParams({
      action: "wbsetclaim",
      claim: JSON.stringify({
        id: guid,
        type: "claim",
        mainsnak: {
          snaktype: "value",
          property,
          datavalue: { value, type: "string" },
        },
      }),
      token: csrfToken,
      origin: CLIENT_URL,
      format: "json",
    }),
    credentials: "include",
  })
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export async function createClaim(
  entity: string,
  property: string,
  value: string
) {
  const csrfToken = await fetchCsrfToken();

  return fetch(API_URL, {
    method: "post",
    body: new URLSearchParams({
      action: "wbcreateclaim",
      entity,
      property,
      snaktype: "value",
      value: JSON.stringify(value),
      token: csrfToken,
      origin: CLIENT_URL,
      format: "json",
    }),
    credentials: "include",
  })
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}

export type { SparqlQueryDesc };
