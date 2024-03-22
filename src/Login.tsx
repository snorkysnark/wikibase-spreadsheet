import { ReactNode, createContext, useEffect, useRef, useState } from "react";
import { useAsyncFn, useEffectOnce } from "react-use";
import { checkLogin } from "./wikibase";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  TextField,
} from "@mui/material";

const LoginContext = createContext<{ logout: () => void }>({
  logout: () => {},
});

function Login({ children }: { children?: ReactNode }) {
  const [loginState, login] = useAsyncFn(checkLogin);
  useEffectOnce(() => {
    login({ action: "check" });
  });
  useEffect(() => {
    if (loginState.error) console.error(loginState.error);
  }, [loginState]);

  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [rememberMe, setRememberMe] = useState(false);

  if (loginState.value) {
    return (
      <LoginContext.Provider
        value={{
          logout: () => {
            login({ action: "logout" });
          },
        }}
      >
        {children}
      </LoginContext.Provider>
    );
  } else {
    return (
      <div
        css={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {loginState.loading ? (
          <CircularProgress />
        ) : (
          <Paper css={{ padding: "1em" }} elevation={2}>
            <form
              css={{ display: "flex", flexDirection: "column" }}
              onSubmit={(event) => {
                event.preventDefault();
                if (usernameInput.current && passwordInput.current) {
                  login({
                    action: "login",
                    username: usernameInput.current.value,
                    password: passwordInput.current.value,
                    rememberMe: rememberMe,
                  });
                }
              }}
            >
              <TextField
                variant="filled"
                label="Username"
                autoComplete="username"
                inputRef={usernameInput}
              />
              <TextField
                variant="filled"
                type="password"
                label="Password"
                autoComplete="current-password"
                inputRef={passwordInput}
              />

              <FormControlLabel
                control={<Checkbox />}
                label="Remember me"
                value={rememberMe.toString()}
                onInput={(event) =>
                  setRememberMe(
                    (event.target as HTMLInputElement).value === "true"
                  )
                }
              />
              <Button type="submit" variant="contained">
                Login
              </Button>
            </form>
          </Paper>
        )}
      </div>
    );
  }
}

export default Login;
export { LoginContext };
