import { useContext, useEffect, useMemo, useState } from "react";
import { LoginContext } from "./Login";
import {
  AppBar,
  Button,
  IconButton,
  MenuItem,
  Select,
  Toolbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import StructurePanel from "./structurepanel/StructurePanel";
import { StructureSettings } from "./structure";
import { useLocalStorage } from "src/hooks";
import { produce } from "immer";
import TableEditor from "./TableEditor";
import { TableRows, queryRows } from "./tableContent";

export default function MainPage() {
  const { logout } = useContext(LoginContext);
  const [tableSettings, setTableSettings] = useLocalStorage<StructureSettings>(
    "table-structure",
    {
      isInstanceProperty: null,
      tables: [],
    }
  );

  const [currentTableUuid, setCurrentTableUuid] = useState<string | null>(null);
  const currentTableIndex = useMemo<number | null>(() => {
    if (!currentTableUuid) return null;

    const index = tableSettings.tables.findIndex(
      (table) => table.uuid == currentTableUuid
    );
    return index === -1 ? null : index;
  }, [tableSettings, currentTableUuid]);

  const [tableContent, setTableContent] = useState<TableRows | null>(null);
  useEffect(() => {
    setTableContent(null);

    if (tableSettings.isInstanceProperty && currentTableIndex !== null) {
      let valid = true;

      queryRows(
        tableSettings.isInstanceProperty,
        tableSettings.tables[currentTableIndex]
      ).then((data) => {
        if (valid) setTableContent(data);
      });

      return () => {
        valid = false;
      };
    }
  }, [tableSettings, currentTableIndex]);

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
            {tableSettings.tables.map((table) => (
              <MenuItem key={table.uuid} value={table.uuid}>
                {table.name}
              </MenuItem>
            ))}
          </Select>
          <IconButton aria-label="add row">
            <AddIcon />
          </IconButton>
          <div css={{ flex: "1" }} />
          <Button variant="contained" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <div css={{ width: "100%", height: "100%", display: "flex" }}>
        <div css={{ flex: "1" }}>
          {currentTableIndex !== null && tableContent && (
            <TableEditor
              tableStructure={tableSettings.tables[currentTableIndex]}
              data={tableContent}
            />
          )}
        </div>
        <div
          css={{
            width: "30%",
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
          }}
        >
          <StructurePanel
            isInstanceProperty={tableSettings.isInstanceProperty}
            onChangeInstanceProperty={(isInstanceProperty) =>
              setTableSettings(
                produce((tableStructure) => {
                  tableStructure.isInstanceProperty = isInstanceProperty;
                })
              )
            }
            existing={currentTableIndex !== null}
            tableStructure={
              currentTableIndex !== null
                ? tableSettings.tables[currentTableIndex]
                : null
            }
            onChangeStucture={(value) => {
              if (currentTableIndex !== null) {
                // Existing table
                setTableSettings(
                  produce((settings) => {
                    settings.tables[currentTableIndex].name = value.name;
                    settings.tables[currentTableIndex].parentItem =
                      value.parentItem;
                    settings.tables[currentTableIndex].fields = value.fields;
                  })
                );
              } else {
                // New table
                const newUuid = crypto.randomUUID();
                setTableSettings(
                  produce((settings) => {
                    settings.tables.push({ uuid: newUuid, ...value });
                  })
                );
                setCurrentTableUuid(newUuid);
              }
            }}
            onDelete={() => {
              if (currentTableUuid) {
                setCurrentTableUuid(null);
                setTableSettings(
                  produce((settings) => {
                    settings.tables = settings.tables.filter(
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
