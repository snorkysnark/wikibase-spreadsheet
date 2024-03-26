import { useContext, useState } from "react";
import { LoginContext } from "./Login";
import { AppBar, Button, MenuItem, Select, Toolbar } from "@mui/material";
import { HotTable } from "@handsontable/react";
import StructurePanel from "./structurepanel/StructurePanel";
import { StructureSettings } from "./structure";
import { useLocalStorage } from "src/hooks";
import { produce } from "immer";

export default function MainPage() {
  const { logout } = useContext(LoginContext);
  const [tableStructure, setTableStructure] =
    useLocalStorage<StructureSettings>("table-structure", {
      isInstanceProperty: null,
      tables: [],
    });

  const [currentTableUuid, setCurrentTableUuid] = useState<string | null>(null);

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
          <Select
            variant="standard"
            value={currentTableUuid ?? "new-table"}
            onChange={(event) =>
              setCurrentTableUuid(
                event.target.value === "new-table" ? null : event.target.value
              )
            }
          >
            <MenuItem value="new-table">New Table</MenuItem>
            {tableStructure.tables.map((table) => (
              <MenuItem key={table.uuid} value={table.uuid}>
                {table.name}
              </MenuItem>
            ))}
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
            licenseKey="non-commercial-and-evaluation"
          />
        </div>
        <div
          css={{
            width: "30%",
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <StructurePanel
            isInstanceProperty={tableStructure.isInstanceProperty}
            onChangeInstanceProperty={(isInstanceProperty) =>
              setTableStructure(
                produce((tableStructure) => {
                  tableStructure.isInstanceProperty = isInstanceProperty;
                })
              )
            }
            existing={!!currentTableUuid}
            tableStructure={
              (currentTableUuid &&
                tableStructure.tables.find(
                  (table) => table.uuid === currentTableUuid
                )) ||
              null
            }
            onChangeStucture={(value) => {
              if (currentTableUuid) {
                // Existing table
                setTableStructure(
                  produce((settings) => {
                    settings.tables = settings.tables.map((table) =>
                      table.uuid === currentTableUuid
                        ? { uuid: currentTableUuid, ...value }
                        : table
                    );
                  })
                );
              } else {
                // New table
                const newUuid = crypto.randomUUID();
                setTableStructure(
                  produce((settings) =>
                    settings.tables.push({ uuid: newUuid, ...value })
                  )
                );
                setCurrentTableUuid(newUuid);
              }
            }}
            onDelete={() => {
              if (currentTableUuid) {
                setCurrentTableUuid(null);
                setTableStructure(
                  produce((settings) => {
                    settings.tables.filter(
                      (table) => table.uuid !== currentTableUuid
                    );
                  })
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
