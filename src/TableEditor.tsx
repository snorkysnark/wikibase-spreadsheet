import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import { TableRows } from "./tableContent";
import { HotTable } from "@handsontable/react";
import HotTableClass from "node_modules/@handsontable/react/hotTableClass";

export interface TableEditorHandle {
  addRow: () => void;
}

type CellChangeNumeric = [number, number, any, any];

const TableEditor = forwardRef(function TableEditor(
  {
    data,
    tableStructure,
  }: {
    data: TableRows;
    tableStructure: TableStructure<string>;
  },
  ref: ForwardedRef<TableEditorHandle>
) {
  const hotRef = useRef<HotTableClass | null>(null);
  const hotInstance = () => hotRef.current?.hotInstance;

  useImperativeHandle(ref, () => {
    return {
      addRow: () => {
        const hot = hotInstance();
        if (hot)
          hot.batch(() => {
            hot.alter("insert_row_below");
            const lastRow = hot.getData().length - 1;

            // 0th column is the label
            for (let i = 0; i <= tableStructure.fields.length; i++) {
              hot.setCellMeta(lastRow, i, "className", "edited");
            }
          });
      },
    };
  });

  const afterEdit = useCallback((changes: CellChangeNumeric[]) => {
    const hot = hotInstance()!;
    let refresh = false;

    for (const [row, column, prevValue, nextValue] of changes) {
      // Skip new (non-uploaded) rows
      if (row >= data.rowHeaders.length) continue;

      // Get or save original value
      let originalValue = hot.getCellMeta(row, column).originalValue;
      if (originalValue === undefined) {
        hot.setCellMeta(row, column, "originalValue", prevValue);
        originalValue = prevValue;
      }

      if (nextValue !== originalValue) {
        hot.setCellMeta(row, column, "edited", true);
        hot.setCellMeta(row, column, "className", "edited");
      } else {
        hot.removeCellMeta(row, column, "edited");
        hot.removeCellMeta(row, column, "className");
      }
      refresh = true;
    }

    if (refresh) hot.render();
  }, []);

  return (
    <HotTable
      ref={hotRef}
      colHeaders={[
        "label",
        ...tableStructure.fields.map((field) => field.name),
      ]}
      rowHeaders={(index) =>
        index < data.rowHeaders.length ? data.rowHeaders[index] : "?"
      }
      data={data.rows}
      licenseKey="non-commercial-and-evaluation"
      afterChange={(changes, source) => {
        if (source === "edit" && changes) {
          afterEdit(changes as CellChangeNumeric[]);
        }
      }}
    />
  );
});

export default TableEditor;
