import { useRef } from "react";
import { useAsyncFn, useEffectOnce } from "react-use";
import { checkLogin } from "./wikibase";

function Login() {
  const [loginState, login] = useAsyncFn(checkLogin);
  useEffectOnce(() => {
    login();
  });

  const usernameInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);

  if (loginState.loading) {
    return "Loading";
  } else if (loginState.value) {
    return "Logged in";
  } else {
    return (
      <form
        onSubmit={() => {
          if (usernameInput.current && passwordInput.current) {
            login({
              username: usernameInput.current.value,
              password: passwordInput.current.value,
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
        <button type="submit" className="bg-gray-200 p-2 cursor-pointer">
          Login
        </button>
      </form>
    );
  }
}

export default Login;
