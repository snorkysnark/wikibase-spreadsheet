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

export interface TableEditorHandle {}

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
  const hot = useRef<Handsontable | null>(null);

  useEffect(() => {
    hot.current = new Handsontable(container.current!, {
      colHeaders: tableStructure.fields.map((field) => field.name),
      rowHeaders: (index) =>
        index < data.rowHeaders.length ? data.rowHeaders[index] : "?",
      data: data.rows,
      licenseKey: "non-commercial-and-evaluation",
    });

    return () => {
      hot.current!.destroy();
    };
  }, [data, tableStructure]);

  useImperativeHandle(ref, () => ({}));

  return <div ref={container}></div>;
});

export default TableEditor;
