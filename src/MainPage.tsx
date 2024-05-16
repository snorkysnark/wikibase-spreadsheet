import { useMemo, useRef, useState } from "react";

import { useSettings, map } from "./structure";
import { TableEditorHandle } from "./TableEditor";
import ControlsBar from "./ControlsBar";
import StructurePanel from "./structurepanel";

type DialogState = { type: "export" } | { type: "import" };

export default function MainPage() {
  const [settings, alterSettings] = useSettings();

  const [currentTableUuid, setCurrentTableUuid] = useState<string | null>(null);
  const currentTable = useMemo(
    () =>
      currentTableUuid
        ? settings.tables.byUuid[currentTableUuid].definition
        : null,
    [settings.tables, currentTableUuid]
  );

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
          tables={map(settings.tables, (table) => table.definition)}
          addRow={() => hotRef.current?.addDefaultRow()}
          deleteRow={() => hotRef.current?.toggleRowDeletion()}
          reload={() => {}}
          csvExport={() => setDialogState({ type: "export" })}
          csvImport={() => setDialogState({ type: "import" })}
        />
        <div css={{ width: "100%", height: "100%", display: "flex" }}>
          <div css={{ flex: "1" }}></div>
          <div
            css={{
              width: "30%",
              borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
            }}
          >
            <StructurePanel
              isInstanceProperty={settings.isInstanceProperty}
              onChangeInstanceProperty={alterSettings.setInstanceProperty}
              tableStructure={currentTable}
              onChangeStucture={(data) => {
                if (currentTableUuid) {
                  alterSettings.alterTable(currentTableUuid, data);
                } else {
                  setCurrentTableUuid(alterSettings.addTable(data));
                }
              }}
              onDelete={() => {
                if (currentTableUuid) {
                  setCurrentTableUuid(null);
                  alterSettings.deleteTable(currentTableUuid);
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
