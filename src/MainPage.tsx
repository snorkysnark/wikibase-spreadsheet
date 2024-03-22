import { useContext } from "react";
import { LoginContext } from "./Login";
import { AppBar, Button, MenuItem, Select, Toolbar } from "@mui/material";
import { HotTable } from "@handsontable/react";
import StructurePanel from "./structurepanel/StructurePanel";

export default function MainPage() {
  const { logout } = useContext(LoginContext);

  return (
    <div
      css={{
        display: "flex",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <AppBar
        position="static"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "lightblue",
        }}
      >
        <Toolbar variant="dense">
          <Select variant="standard" defaultValue="new-table">
            <MenuItem value="new-table">New Table</MenuItem>
          </Select>
          <div css={{ flex: "1" }} />
          <Button variant="contained" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <div css={{ width: "100%", height: "100%", display: "flex" }}>
        <div css={{ flex: "1" }}>
          <HotTable
            colHeaders={true}
            manualColumnMove={true}
            dropdownMenu={true}
            licenseKey="non-commercial-and-evaluation"
          />
        </div>
        <div
          css={{
            width: "30%",
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <StructurePanel />
        </div>
      </div>
    </div>
  );
}
