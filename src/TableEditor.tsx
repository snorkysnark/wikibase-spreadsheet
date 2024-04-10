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

export interface TableModifications {
  changed: any;
  added: any[];
}

export interface TableEditorHandle {
  addRow: () => void;
  getModifications: () => TableModifications;
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

            // Set random unique label
            hot.setDataAtCell(lastRow, 0, crypto.randomUUID());

            for (let i = 0; i < tableStructure.fields.length; i++) {
              hot.setCellMeta(lastRow, i, "className", "edited");
            }
          });
      },
      getModifications: () => {
        const changed: any = {};
        let added: any[] = [];

        const hot = hotInstance();
        if (hot) {
          // Find changed cells
          for (const meta of hot.getCellsMeta()) {
            if (meta.row >= data.rowHeaders.length) {
              // Newly added rows begin here
              break;
            }

            if (meta.edited) {
              const value = hot.getDataAtCell(meta.row, meta.col);
              const itemId = data.rowHeaders[meta.row];
              const propertyId = tableStructure.fields[meta.col].property;

              if (!changed[itemId]) changed[itemId] = {};
              changed[itemId][propertyId] = value;
            }
          }

          // New rows
          added = hot
            .getData()
            .slice(data.rowHeaders.length)
            .map((row: any[]) =>
              Object.fromEntries(
                row
                  .map((value, index) => [
                    tableStructure.fields[index].property,
                    value,
                  ])
                  .filter(([_, value]) => value !== null)
              )
            );
        }
        return { changed, added };
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
    <>
      <HotTable
        ref={hotRef}
        colHeaders={tableStructure.fields.map((field) => field.name)}
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
      <button onClick={() => console.log(hotInstance()?.getCellsMeta())}>
        CellMeta
      </button>
    </>
  );
});

export default TableEditor;
