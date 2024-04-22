import { handleErrors } from "./errors";

const BASE_URL = "http://localhost:8030";
const WIKI_URL = BASE_URL + "/wiki";
const API_URL = BASE_URL + "/api.php";

const CLIENT_URL = "http://localhost:5173";

export async function fetchLoginToken(): Promise<string> {
  return handleErrors(
    fetch(
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
  ).then((json) => json.query.tokens.logintoken);
}

async function fetchCsrfToken(): Promise<string> {
  return handleErrors(
    fetch(
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
  ).then((json) => json.query.tokens.csrftoken);
}

export async function assertLogin() {
  return handleErrors(
    fetch(
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
  );
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

  return handleErrors(
    fetch(API_URL, {
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
  );
}

export async function logout() {
  const csrfToken = await fetchCsrfToken();
  return handleErrors(
    fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "logout",
        token: csrfToken,
        format: "json",
        origin: CLIENT_URL,
      }),
      credentials: "include",
    })
  );
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
  return handleErrors(
    fetch(
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
  );
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
  return handleErrors(
    fetch(API_URL, {
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
  );
}

export function getItemUrl(type: EntityType, id: string) {
  return `${WIKI_URL}/${type}:${id}`;
}

export interface GetClaimsResult {
  claims: { [property: string]: { id: string }[] };
}

export async function getClaims(item: string): Promise<GetClaimsResult> {
  return handleErrors(
    fetch(
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
  );
}

export async function setClaimValue(
  guid: string,
  property: string,
  value: string
) {
  const csrfToken = await fetchCsrfToken();

  return handleErrors(
    fetch(API_URL, {
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
  );
}

export async function createClaim(
  entity: string,
  property: string,
  value: string
) {
  const csrfToken = await fetchCsrfToken();

  return handleErrors(
    fetch(API_URL, {
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
  );
}

export async function deleteItem(itemId: string) {
  const csrfToken = await fetchCsrfToken();

  return handleErrors(
    fetch(API_URL, {
      method: "post",
      body: new URLSearchParams({
        action: "delete",
        title: `Item:${itemId}`,
        token: csrfToken,
        origin: CLIENT_URL,
        format: "json",
      }),
      credentials: "include",
    })
  );
}

export { ResponseError, type ErrorData, WikibaseError } from "./errors";
