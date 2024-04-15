import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import { TableRows } from "./tableContent";
import Handsontable from "handsontable";

type CellChangeNumeric = [number, number, any, any];

export interface TableEditorHandle {
  addRow: () => void;
  toggleRowDeletion: () => void;
}

function addRow(hot: Handsontable) {
  hot.batch(() => {
    hot.alter("insert_row_below");
    const numRows = hot.countRows();
    const numColumns = hot.countCols();

    // Set random unique label
    hot.setDataAtCell(numRows - 1, 0, crypto.randomUUID());

    hot.countRows;
    for (let i = 0; i < numColumns; i++) {
      hot.setCellMeta(numRows - 1, i, "className", "edited");
    }
  });
}

function afterEdit(
  hot: Handsontable,
  changes: CellChangeNumeric[],
  existingRows: number
) {
  for (const [row, column, prevValue, nextValue] of changes) {
    if (row >= existingRows) continue;

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
  }

  hot.render();
}

function getSelectedRows(hot: Handsontable): Set<number> {
  const rows = new Set<number>();
  const selectedRanges = hot.getSelectedRange();

  if (selectedRanges) {
    for (const range of selectedRanges) {
      for (let row = range.from.row; row <= range.to.row; row++) {
        rows.add(row);
      }
    }
  }

  return rows;
}

function setRowDeletionMetadata(
  hot: Handsontable,
  row: number,
  value: boolean
) {
  const numColumns = hot.countCols();
  for (let col = 0; col < numColumns; col++) {
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
  const container = useRef<HTMLDivElement | null>(null);
  const hotRef = useRef<Handsontable | null>(null);
  const rowsForDeletion = useRef(new Set<number>());

  useEffect(() => {
    const hot = new Handsontable(container.current!, {
      colHeaders: tableStructure.fields.map((field) => field.name),
      rowHeaders: (index) =>
        index < data.rowHeaders.length ? data.rowHeaders[index] : "?",
      data: data.rows,
      outsideClickDeselects: false,
      licenseKey: "non-commercial-and-evaluation",
    });
    hot.updateSettings({
      afterChange: (changes, source) => {
        if (source === "edit" && changes) {
          afterEdit(
            hot,
            changes as CellChangeNumeric[],
            data.rowHeaders.length
          );
        }
      },
    });

    hotRef.current = hot;

    return () => {
      hotRef.current!.destroy();
      rowsForDeletion.current.clear();
    };
  }, [data, tableStructure]);

  useImperativeHandle(ref, () => ({
    addRow: () => {
      if (hotRef.current) addRow(hotRef.current);
    },
    toggleRowDeletion: () => {
      const hot = hotRef.current;
      if (!hot) return;

      hot.batch(() => {
        for (const row of getSelectedRows(hot)) {
          if (row < data.rowHeaders.length) {
            // Existing row, mark to delete later
            if (rowsForDeletion.current.has(row)) {
              rowsForDeletion.current.delete(row);
              setRowDeletionMetadata(hot, row, false);
            } else {
              rowsForDeletion.current.add(row);
              setRowDeletionMetadata(hot, row, true);
            }
          } else {
            // New row, delete immediately
            hot.alter("remove_row", row);
          }
        }
      });

      hot.render();
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
