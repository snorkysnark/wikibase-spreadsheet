import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import { SparqlTable } from "./wikibase/sparql";
import Handsontable from "handsontable";
import { CellMeta } from "node_modules/handsontable/settings";

export interface TableEditorHandle {}

function getCellSettings(
  hot: Handsontable,
  row: number,
  column: number,
  prop: string
): CellMeta {
  if (hot.getDataAtRowProp(row, "deleted")) {
    return { className: "deleted", readOnly: true };
  }

  const itemId = hot.getDataAtRowProp(row, "itemId");
  if (itemId === null) {
    return { className: "edited" }; // New row
  }

  const originalValue = hot.getDataAtRowProp(
    row,
    prop.replace(/\.value$/, ".originalValue")
  );
  if (
    originalValue !== null &&
    originalValue !== hot.getDataAtCell(row, column)
  ) {
    return { className: "edited" };
  }

  return {};
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

const TableEditor = forwardRef(function TableEditor(
  {
    data,
    tableStructure,
  }: {
    data: SparqlTable;
    tableStructure: TableStructure<string>;
  },
  ref: ForwardedRef<TableEditorHandle>
) {
  const container = useRef<HTMLDivElement | null>(null);
  const hotRef = useRef<Handsontable | null>(null);

  useEffect(() => {
    const hot = new Handsontable(container.current!, {
      colHeaders: [
        "label",
        ...tableStructure.fields.map((field) => field.name),
      ],
      data: data.rows,
      dataSchema: {
        itemId: null,
        label: { value: "" },
        properties: Object.fromEntries(
          tableStructure.fields.map((field) => [
            field.property,
            { guid: null, value: null },
          ])
        ),
      },
      columns: [
        { data: "label.value" },
        ...tableStructure.fields.map((field) => ({
          data: `properties.${field.property}.value`,
        })),
      ],
      outsideClickDeselects: false,
      licenseKey: "non-commercial-and-evaluation",
    });
    hot.updateSettings({
      rowHeaders: (index) => {
        const itemId: number | null = hot.getDataAtRowProp(index, "itemId");
        return itemId !== null ? `Q${itemId}` : "?";
      },
      cells(row, column, prop) {
        return getCellSettings(hot, row, column, prop as string);
      },
      beforeChange(changes, source) {
        for (const [row, column, prevValue, nextValue] of changes.filter(
          notEmpty
        )) {
          const prop = column as string;
          const propStart = prop.substring(0, prop.lastIndexOf("."));

          console.log(
            "originalValue",
            hot.getDataAtRowProp(row, propStart + ".originalValue")
          );
        }
      },
    });

    hotRef.current = hot;

    return () => {
      hot.destroy();
    };
  }, [data, tableStructure]);

  useImperativeHandle(ref, () => ({}));

  return <div ref={container}></div>;
});

export default TableEditor;
