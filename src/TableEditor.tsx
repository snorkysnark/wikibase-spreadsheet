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

export interface TableEditorHandle {
  addRow: () => void;
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

  useEffect(() => {
    hotRef.current = new Handsontable(container.current!, {
      colHeaders: tableStructure.fields.map((field) => field.name),
      rowHeaders: (index) =>
        index < data.rowHeaders.length ? data.rowHeaders[index] : "?",
      data: data.rows,
      licenseKey: "non-commercial-and-evaluation",
    });

    return () => {
      hotRef.current!.destroy();
    };
  }, [data, tableStructure]);

  useImperativeHandle(ref, () => ({
    addRow: () => {
      if (hotRef.current) addRow(hotRef.current);
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
