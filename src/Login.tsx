import { ReactNode, createContext, useRef, useState } from "react";
import { useAsyncFn, useEffectOnce } from "react-use";
import { checkLogin } from "./wikibase";

const LoginContext = createContext<{ logout: () => void }>({
  logout: () => {},
});

function Login({ children }: { children?: ReactNode }) {
  const [loginState, login] = useAsyncFn(checkLogin);
  useEffectOnce(() => {
    login({ action: "check" });
  });

  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [rememberMe, setRememberMe] = useState(false);

  if (loginState.loading) {
    return "Loading";
  } else if (loginState.value) {
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
      <form
        onSubmit={() => {
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
        <label>
          Username:
          <input
            className="border-black border-2 block"
            type="text"
            autoComplete="username"
            ref={usernameInput}
          />
        </label>
        <label>
          Password:
          <input
            className="border-black border-2 block"
            type="password"
            autoComplete="current-password"
            ref={passwordInput}
          />
        </label>
        <label>
          <input
            type="checkbox"
            className="m-2"
            value={rememberMe.toString()}
            onInput={(event) =>
              setRememberMe((event.target as HTMLInputElement).value === "true")
            }
          />
          Remember me
        </label>
        <button type="submit" className="block bg-gray-200 p-2 cursor-pointer">
          Login
        </button>
      </form>
    );
  }
}

export default Login;
export { LoginContext };
