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

async function checkLogin(fields?: {
  username: string;
  password: string;
}): Promise<boolean> {
  if (fields) {
    // Try login
    const loginToken = await fetchLoginToken();
    console.log(loginToken);

    return fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "clientlogin",
        logintoken: loginToken,
        loginreturnurl: LOGIN_RETURN_URL,
        format: "json",
        ...fields,
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
  } else {
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
  }
}

export { checkLogin };
