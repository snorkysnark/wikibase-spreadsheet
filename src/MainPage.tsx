import { useEffect, useMemo, useRef, useState } from "react";

import { useSettings, map } from "./structure";
import TableEditor, { TableEditorHandle } from "./TableEditor";
import ControlsBar from "./ControlsBar";
import StructurePanel from "./structurepanel";
import { useAsync } from "@react-hookz/web";
import { LocalRow, loadTableFromQuery } from "./localTable";
import { useMutation } from "react-query";
import { NamedTask } from "./uploadTasks";
import UploadDialog from "./UploadDialog";

type DialogState = { type: "export" } | { type: "import" };

async function runTasks(
  tasks: NamedTask[],
  setDescription: (value: string | null) => void
) {
  for (const task of tasks) {
    setDescription(task.description);
    await task.run();
  }
  setDescription(null);
}

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

  const [tableQuery, queryAction] = useAsync<LocalRow[] | null>(async () => {
    if (!settings.isInstanceProperty || !currentTable) return null;

    return loadTableFromQuery({
      isInstanceProp: settings.isInstanceProperty,
      parent: currentTable.parentItem,
      properties: currentTable.fields.map((field) => field.property),
    });
  }, null);
  useEffect(() => {
    queryAction.execute();
  }, [settings, currentTable]);

  const hotRef = useRef<TableEditorHandle | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const [taskDescription, setTaskDescription] = useState<string | null>(null);
  const tasks = useMutation<void, Error, NamedTask[]>(
    (tasks: NamedTask[]) => runTasks(tasks, setTaskDescription),
    { onSettled: () => queryAction.execute() }
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
        <ControlsBar
          currentTable={currentTableUuid}
          setCurrentTable={setCurrentTableUuid}
          tables={map(settings.tables, (table) => table.definition)}
          addRow={() => hotRef.current?.addDefaultRow()}
          deleteRow={() => hotRef.current?.toggleRowDeletion()}
          reload={() => {
            queryAction.execute();
          }}
          upload={() => {
            if (hotRef.current) {
              tasks.mutate(hotRef.current.getModifications());
            }
          }}
          csvExport={() => setDialogState({ type: "export" })}
          csvImport={() => setDialogState({ type: "import" })}
        />
        <div css={{ width: "100%", height: "100%", display: "flex" }}>
          <div css={{ flex: "1" }}>
            {currentTable && tableQuery.result && (
              <TableEditor
                ref={hotRef}
                data={tableQuery.result}
                tableStructure={currentTable}
                isInstanceProp={settings.isInstanceProperty!}
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
