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

type CheckLoginParams =
  | { action: "check" }
  | {
      action: "login";
      username: string;
      password: string;
      rememberMe?: boolean;
    }
  | { action: "logout" };

async function checkLogin(action: CheckLoginParams): Promise<boolean> {
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
          ...(action.rememberMe && { rememberMe: "true" }),
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

type EntityType = "form" | "item" | "lexeme" | "property" | "sense";

interface SearchEntitiesParams {
  search: string;
  language?: string;
  type?: EntityType;
  limit?: string;
  continue?: string;
  props?: string;
}

async function searchEntities(params: SearchEntitiesParams): Promise<any> {
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

export {
  checkLogin,
  searchEntities,
  type SearchEntitiesParams,
  type EntityType,
};
