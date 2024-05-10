import {
  AppBar,
  IconButton,
  Button,
  MenuItem,
  Select,
  Toolbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowUpward as UploadIcon,
  Cached as ReloadIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
} from "@mui/icons-material";
import { TableStructure } from "./structure";
import { useContext } from "react";
import { LoginContext } from "./Login";

export default function ControlsBar({
  currentTable,
  setCurrentTable,
  tables,
  addRow,
  deleteRow,
  reload,
  csvExport,
  csvImport,
}: {
  currentTable: string | null;
  setCurrentTable: (value: string | null) => void;
  tables: TableStructure<string>[];
  addRow(): void;
  deleteRow(): void;
  reload(): void;
  csvExport(): void;
  csvImport(): void;
}) {
  const { logout } = useContext(LoginContext);

  return (
    <AppBar
      position="static"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "lightblue",
      }}
    >
      <Toolbar variant="dense">
        <Select
          variant="standard"
          value={currentTable || "new-table"}
          onChange={(event) =>
            setCurrentTable(
              event.target.value === "new-table" ? null : event.target.value
            )
          }
        >
          <MenuItem value="new-table">New Table</MenuItem>
          {tables.map((table) => (
            <MenuItem key={table.uuid} value={table.uuid}>
              {table.name}
            </MenuItem>
          ))}
        </Select>
        <IconButton aria-label="add row" onClick={addRow}>
          <AddIcon />
        </IconButton>
        <IconButton aria-label="delete row" onClick={deleteRow}>
          <RemoveIcon />
        </IconButton>
        <IconButton aria-label="upload">
          <UploadIcon />
        </IconButton>
        <IconButton aria-label="reload" onClick={reload}>
          <ReloadIcon />
        </IconButton>
        <div css={{ flex: "1" }} />
        <IconButton aria-label="export" onClick={csvExport}>
          <ExportIcon />
        </IconButton>
        <IconButton aria-label="import" onClick={csvImport}>
          <ImportIcon />
        </IconButton>
        <Button variant="contained" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
