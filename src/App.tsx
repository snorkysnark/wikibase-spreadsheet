import Login from "./Login.tsx";
import MainPage from "./MainPage.tsx";
import CssBaseline from "@mui/material/CssBaseline";

export default function App() {
  return (
    <>
      <CssBaseline />
      <Login>
        <MainPage />
      </Login>
    </>
  );
}
