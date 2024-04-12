import {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import { TableModifications, TableRows } from "./tableContent";
import { HotTable } from "@handsontable/react";
import HotTableClass from "node_modules/@handsontable/react/hotTableClass";
import Handsontable from "handsontable";

export interface TableEditorHandle {
  addRow: () => void;
  toggleSelectedRowDeletion: () => void;
  getModifications: () => TableModifications;
}

type CellChangeNumeric = [number, number, any, any];

function getSelectedRows(hot: Handsontable): Set<number> {
  const rows = new Set<number>();
  const selectedRanges = hot.getSelectedRange();

  if (selectedRanges) {
    for (const range of selectedRanges) {
      for (let row = range.from.row; row <= range.to.row; row++) rows.add(row);
    }
  }

  return rows;
}

function setRowDeletionMetadata(
  hot: Handsontable,
  row: number,
  value: boolean,
  columnsLength: number
) {
  for (let col = 0; col < columnsLength; col++) {
    if (value) {
      const meta = hot.getCellMeta(row, col);
      if (meta.edited) {
        hot.setDataAtCell(row, col, meta.originalValue);
        hot.removeCellMeta(row, col, "edited");
      }

      hot.setCellMeta(row, col, "className", "deleted");
      hot.setCellMeta(row, col, "readOnly", true);
    } else {
      hot.removeCellMeta(row, col, "className");
      hot.setCellMeta(row, col, "readOnly", false);
    }
  }
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
  const hotInstance = () => hotRef.current?.hotInstance;

  const rowsForDeletion = useRef(new Set<number>());
  useEffect(() => {
    rowsForDeletion.current.clear();

    const hot = hotInstance();
    if (hot) {
      hot.batchRender(() => {
        for (const meta of hot.getCellsMeta()) {
          hot.removeCellMeta(meta.row, meta.col, "className");
          hot.removeCellMeta(meta.row, meta.col, "edited");
          hot.removeCellMeta(meta.row, meta.col, "originalValue");
          hot.removeCellMeta(meta.row, meta.col, "readOnly");
        }
      });
    }
  }, [data, tableStructure]);

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
      toggleSelectedRowDeletion: () => {
        const hot = hotInstance();
        if (!hot) return;

        hot.batch(() => {
          for (const row of getSelectedRows(hot)) {
            if (row < data.rowHeaders.length) {
              if (rowsForDeletion.current.has(row)) {
                rowsForDeletion.current.delete(row);
                setRowDeletionMetadata(
                  hot,
                  row,
                  false,
                  tableStructure.fields.length
                );
              } else {
                rowsForDeletion.current.add(row);
                setRowDeletionMetadata(
                  hot,
                  row,
                  true,
                  tableStructure.fields.length
                );
              }
            } else {
              hot.alter("remove_row", row);
            }
          }
        });
        hot.render();
      },
      getModifications: () => {
        const changed: any = {};
        let added: any[] = [];
        let deleted: string[] = [];

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

          deleted = [...rowsForDeletion.current].map(
            (row) => data.rowHeaders[row]
          );
        }
        return { changed, added, deleted };
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
      outsideClickDeselects={false}
    />
  );
});

export default TableEditor;
