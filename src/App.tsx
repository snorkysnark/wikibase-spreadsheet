import { QueryClient, QueryClientProvider } from "react-query";
import Login from "./Login.tsx";
import MainPage from "./MainPage.tsx";
import CssBaseline from "@mui/material/CssBaseline";

export default function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <Login>
        <MainPage />
      </Login>
    </QueryClientProvider>
  );
}
