const WIKI_URL = "https://e-qvadrat.wikibase.cloud/wiki";
const API_URL = "http://localhost:5174/api.php";
const LOGIN_RETURN_URL = "http://localhost:5173/";

class ResponseError extends Error {
  response: any;

  constructor(message: string, res: any) {
    super(message);
    this.response = res;
  }
}

async function fetchLoginToken(): Promise<string> {
  return fetch(API_URL + "?action=query&meta=tokens&type=login&format=json", {
    method: "POST",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new ResponseError("Bad response", response);
    })
    .then((json) => json.query.tokens.logintoken);
}

async function fetchCsrfToken(): Promise<string> {
  return fetch(API_URL + "?action=query&meta=tokens&format=json", {
    method: "POST",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new ResponseError("Bad response", response);
    })
    .then((json) => json.query.tokens.csrftoken);
}

export type CheckLoginParams =
  | { action: "check" }
  | {
      action: "login";
      username: string;
      password: string;
      rememberMe?: boolean;
    }
  | { action: "logout" };

export async function checkLogin(action: CheckLoginParams): Promise<boolean> {
  switch (action.action) {
    case "check":
      // Check if already logged in
      return fetch(API_URL + "?action=query&assert=user&format=json", {
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new ResponseError("Bad response", response);
        })
        .then((json) => {
          return !("error" in json);
        });
    case "login":
      // Try login
      const loginToken = await fetchLoginToken();

      return fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({
          action: "clientlogin",
          logintoken: loginToken,
          loginreturnurl: LOGIN_RETURN_URL,
          username: action.username,
          password: action.password,
          ...(action.rememberMe && { rememberMe: "1" }),
          format: "json",
        }),
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new ResponseError("Bad response", response);
        })
        .then((json) => {
          console.log(json);
          return json.clientlogin.status === "PASS";
        });
    case "logout":
      const csrfToken = await fetchCsrfToken();
      await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({
          action: "logout",
          token: csrfToken,
          format: "json",
        }),
        credentials: "include",
      });
      return false;
  }
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
  ).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new ResponseError("Bad response", response);
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
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new ResponseError("Bad response", response);
  });
}

export function getItemUrl(type: EntityType, id: string) {
  return `${WIKI_URL}/${type}:${id}`;
}
