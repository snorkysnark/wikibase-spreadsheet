import { ReactNode, createContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  LoginParams,
  LoginReturnType,
  assertLogin,
  login,
  logout,
} from "./wikibase";

export const LoginContext = createContext<{ logout: () => void }>({
  logout: () => {},
});

interface LoginForm {
  username: string;
  password: string;
  rememberMe?: string;
}

export default function Login({ children }: { children?: ReactNode }) {
  const queryClient = useQueryClient();

  const loginCheck = useQuery(
    "checkLogin",
    async () => {
      try {
        await assertLogin();
        return true;
      } catch {
        return false;
      }
    },
    { cacheTime: 0 }
  );

  const loginMutation = useMutation<LoginReturnType, Error, LoginParams>(
    login,
    {
      onSuccess: (data) => {
        if (data.clientlogin.status === "PASS") {
          queryClient.setQueryData("checkLogin", true);
        }
      },
    }
  );
  useEffect(() => console.log("Logged in", loginCheck.data));

  const logoutMutation = useMutation(logout, {
    onSuccess: () => {
      queryClient.setQueryData("checkLogin", false);
    },
  });

  if (loginCheck.data) {
    return (
      <LoginContext.Provider value={{ logout: logoutMutation.mutate }}>
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
        <Paper css={{ padding: "1em" }} elevation={2}>
          <form
            css={{ display: "flex", flexDirection: "column" }}
            onSubmit={(event) => {
              event.preventDefault();

              const { username, password, rememberMe } = Object.fromEntries(
                new FormData(event.currentTarget)
              ) as unknown as LoginForm;
              loginMutation.mutate({
                username,
                password,
                rememberMe: !!rememberMe,
              });
            }}
          >
            <TextField
              variant="filled"
              label="Username"
              name="username"
              autoComplete="username"
              required
            />
            <TextField
              variant="filled"
              type="password"
              label="Password"
              name="password"
              autoComplete="current-password"
              required
            />

            <FormControlLabel
              control={<Checkbox />}
              label="Remember me"
              name="rememberMe"
            />
            <Button
              disabled={loginMutation.isLoading}
              type="submit"
              variant="contained"
            >
              Login
            </Button>
            {loginMutation.error && (
              <Alert severity="error">{loginMutation.error.message}</Alert>
            )}
            {loginMutation.data?.clientlogin.status === "FAIL" && (
              <Alert severity="error">
                {loginMutation.data.clientlogin.message}
              </Alert>
            )}
          </form>
        </Paper>
      </div>
    );
  }
}
