import { useEffect, useMemo, useRef, useState } from "react";

import StructurePanel from "./structurepanel/StructurePanel";
import { StructureSettings } from "./structure";
import { useLocalStorage } from "src/hooks";
import { produce } from "immer";
import TableEditor, { TableEditorHandle } from "./TableEditor";
import { LocalRow, loadTableFromQuery } from "./localTable";
import ControlsBar from "./ControlsBar";
import { saveToFile } from "./util";
import { ExportDialog, ImportDialog, writeToCsv } from "./csv";

type DialogState = { type: "export" } | { type: "import" };

export default function MainPage() {
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

  const [localTable, setLocalTable] = useState<LocalRow[] | null>(null);
  const [queryResetter, resetQuery] = useState({});
  useEffect(() => {
    if (tableSettings.isInstanceProperty && currentTableIndex !== null) {
      let valid = true;

      loadTableFromQuery({
        isInstanceProp: tableSettings.isInstanceProperty,
        parent: tableSettings.tables[currentTableIndex].parentItem,
        properties: tableSettings.tables[currentTableIndex].fields.map(
          (field) => field.property
        ),
      }).then((data) => {
        if (valid) setLocalTable(data);
      });

      return () => {
        valid = false;
      };
    } else {
      setLocalTable(null);
    }
  }, [tableSettings, currentTableIndex, queryResetter]);

  const hotRef = useRef<TableEditorHandle | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  return (
    <>
      <div
        css={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <ControlsBar
          currentTable={currentTableUuid}
          setCurrentTable={setCurrentTableUuid}
          tables={tableSettings.tables}
          addRow={() => hotRef.current?.addDefaultRow()}
          deleteRow={() => hotRef.current?.toggleRowDeletion()}
          reload={() => resetQuery({})}
          csvExport={() => setDialogState({ type: "export" })}
          csvImport={() => setDialogState({ type: "import" })}
        />
        <div css={{ width: "100%", height: "100%", display: "flex" }}>
          <div css={{ flex: "1" }}>
            {currentTableIndex !== null && localTable && (
              <TableEditor
                ref={hotRef}
                data={localTable}
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

      {dialogState?.type === "export" && (
        <ExportDialog
          onClose={() => setDialogState(null)}
          onSubmit={(params) => {
            if (!hotRef.current || !hotRef.current.table) return;
            const tableName =
              currentTableIndex !== null
                ? tableSettings.tables[currentTableIndex].name
                : "new-table";

            const hot = hotRef.current.table;
            writeToCsv(hot, params, (err, data) =>
              saveToFile(data, `${tableName}.csv`)
            );
          }}
        />
      )}

      {dialogState?.type === "import" && (
        <ImportDialog onClose={() => setDialogState(null)} />
      )}
    </>
  );
}
