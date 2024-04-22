import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { LoginContext } from "./Login";
import {
  AppBar,
  Button,
  IconButton,
  MenuItem,
  Select,
  Toolbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowUpward as UploadIcon,
} from "@mui/icons-material";
import StructurePanel from "./structurepanel/StructurePanel";
import { StructureSettings } from "./structure";
import { useLocalStorage } from "src/hooks";
import { produce } from "immer";
import { SparqlTable, itemSparqlQuery } from "./wikibase/sparql";
import TableEditor, { TableEditorHandle } from "./TableEditor";
import { UploadTask } from "./uploadTasks";
import { useMutation } from "react-query";
import UploadDialog from "./UploadDialog";

async function runTasks(
  tasks: UploadTask[],
  setDescription: (value: string | null) => void
) {
  for (const task of tasks) {
    setDescription(task.description);
    await task.run();
  }
  setDescription(null);
}

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
      (table) => table.uuid === currentTableUuid
    );
    return index >= 0 ? index : null;
  }, [tableSettings, currentTableUuid]);

  const [tableContent, setTableContent] = useState<SparqlTable | null>(null);
  const [queryResetter, resetQuery] = useState({});
  useEffect(() => {
    if (tableSettings.isInstanceProperty && currentTableIndex !== null) {
      let valid = true;

      itemSparqlQuery({
        isInstanceProp: tableSettings.isInstanceProperty,
        parent: tableSettings.tables[currentTableIndex].parentItem,
        properties: tableSettings.tables[currentTableIndex].fields.map(
          (field) => field.property
        ),
      }).then((data) => {
        if (valid) setTableContent(data);
      });

      return () => {
        valid = false;
      };
    } else {
      setTableContent(null);
    }
  }, [tableSettings, currentTableIndex, queryResetter]);

  const hotRef = useRef<TableEditorHandle | null>(null);
  const [taskDescription, setTaskDescription] = useState<string | null>(null);
  const tasks = useMutation<void, Error, UploadTask[]>(
    (tasks: UploadTask[]) => runTasks(tasks, setTaskDescription),
    { onSettled: () => resetQuery({}) }
  );

  return (
    <>
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
              value={currentTableUuid || "new-table"}
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
            <IconButton
              aria-label="add row"
              onClick={() => hotRef.current?.addRow()}
            >
              <AddIcon />
            </IconButton>
            <IconButton
              aria-label="delete row"
              onClick={() => hotRef.current?.toggleRowDeletion()}
            >
              <RemoveIcon />
            </IconButton>
            <IconButton
              aria-label="upload"
              onClick={() => {
                if (hotRef.current) {
                  tasks.mutate(hotRef.current.getModifications());
                }
              }}
            >
              <UploadIcon />
            </IconButton>
            <Button onClick={() => resetQuery({})}>reload</Button>
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
                ref={hotRef}
                data={tableContent}
                tableStructure={tableSettings.tables[currentTableIndex]}
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
                  produce((settings) => {
                    settings.isInstanceProperty = isInstanceProperty;
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
                      const { uuid } = settings.tables[currentTableIndex];
                      settings.tables[currentTableIndex] = { uuid, ...value };
                    })
                  );
                } else {
                  // New table
                  const uuid = crypto.randomUUID();
                  setTableSettings(
                    produce((settings) => {
                      settings.tables.push({ uuid, ...value });
                    })
                  );
                  setCurrentTableUuid(uuid);
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

      {taskDescription && (
        <UploadDialog
          description={taskDescription}
          error={tasks.error}
          onClose={() => {
            if (tasks.isError) {
              tasks.reset();
              setTaskDescription(null);
            }
          }}
        />
      )}
    </>
  );
}
