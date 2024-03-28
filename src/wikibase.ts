const WIKI_URL = "https://e-qvadrat.wikibase.cloud/wiki";
const API_URL = "http://localhost:5174/api.php";
const LOGIN_RETURN_URL = "http://localhost:5173/";

class ResponseError extends Error {
  response: Response;

  constructor(response: Response) {
    super(`Bad response: ${response.status}`);
    this.response = response;
  }

  static raiseForStatus(response: Response) {
    if (!response.ok) throw new ResponseError(response);
  }
}

class WikibaseError extends Error {
  data: any;

  constructor(data: any) {
    super(data.error.info || "Unknown error");
    this.data = data;
  }

  static raiseForErrors(data: any) {
    if ("error" in data) throw new WikibaseError(data);
  }
}

export async function fetchLoginToken(): Promise<string> {
  return fetch(API_URL + "?action=query&meta=tokens&type=login&format=json", {
    method: "POST",
    credentials: "include",
  })
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
  return fetch(API_URL + "?action=query&meta=tokens&format=json", {
    method: "POST",
    credentials: "include",
  })
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
  return fetch(API_URL + "?action=query&assert=user&format=json", {
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
      loginreturnurl: LOGIN_RETURN_URL,
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

export async function editEntity(params: EditEntityParams) {
  const csrfToken = await fetchCsrfToken();
  return fetch(API_URL, {
    method: "post",
    body: new URLSearchParams({
      action: "wbeditentity",
      token: csrfToken,
      format: "json",
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
