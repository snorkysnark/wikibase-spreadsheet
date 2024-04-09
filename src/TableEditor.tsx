import {
  ForwardedRef,
  MutableRefObject,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import { TableRows } from "./tableContent";
import { HotTable } from "@handsontable/react";
import HotTableClass from "node_modules/@handsontable/react/hotTableClass";
import Handsontable from "handsontable";

export interface TableEditorHandle {
  addRow: () => void;
}

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
  const hotBatch = useCallback(
    (wrappedOperations: (hot: Handsontable) => void) => {
      const hot = hotRef.current?.hotInstance;
      if (hot) {
        hot.batch(() => wrappedOperations(hot));
      }
    },
    []
  );

  useImperativeHandle(ref, () => {
    return {
      addRow: () => {
        hotBatch((hot) => {
          hot.alter("insert_row_below");
          const lastRow = hot.getData().length - 1;

          for (let i = 0; i <= tableStructure.fields.length; i++) {
            hot.setCellMeta(lastRow, i, "className", "edited");
          }
        });
      },
    };
  });

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
          hotBatch((hot) => {
            for (const [row, column, _, nextValue] of changes) {
              hot.setCellMeta(row, column as number, "className", "edited");
            }
          });
          hotRef.current?.hotInstance?.render();
        }
      }}
    />
  );
});

export default TableEditor;
