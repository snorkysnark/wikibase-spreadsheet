import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import Handsontable from "handsontable";
import { CellMeta, CellProperties } from "node_modules/handsontable/settings";
import { nonNullish } from "./util";
import { LocalRow } from "./localTable";

export interface TableEditorHandle {
  render(): void;
}

type CellChangeString = [number, string, any, any];

function extendCellSettings(
  hot: Handsontable,
  settings: CellProperties,
  row: number,
  column: number
): CellMeta {
  if (hot.getDataAtRowProp(row, "deleted")) {
    return { className: "deleted", readOnly: true };
  }

  const itemId = hot.getDataAtRowProp(row, "itemId");
  if (itemId === null) {
    return { className: "edited" }; // New row
  }

  const originalValue = settings.originalValue;
  if (originalValue && originalValue !== hot.getDataAtCell(row, column)) {
    return { className: "edited" };
  }

  return { className: undefined, readOnly: false };
}

function updateRowProp(
  hot: Handsontable,
  row: number,
  column: number,
  prevValue: any,
  nextValue: any
) {
  const originalValue = hot.getCellMeta(row, column).originalValue;

  hot.setDataAtCell(row, column, nextValue, "auto");
  hot.setCellMeta(row, column, "originalValue", originalValue ?? prevValue);
}

type PropFilter = [prop: string, value: any];

function rowMatchesFilters(
  hot: Handsontable,
  row: number,
  filters: PropFilter[]
): boolean {
  for (const [prop, value] of filters) {
    if (hot.getDataAtRowProp(row, prop) !== value) return false;
  }
  return true;
}

const TableEditor = forwardRef(function TableEditor(
  {
    data,
    tableStructure,
  }: {
    data: LocalRow[];
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
      data,
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
      cells(row, column) {
        return extendCellSettings(hot, this, row, column);
      },
      beforeChange(changes, source) {
        if (source !== "edit") return;

        for (const [row, prop, prevValue, nextValue] of changes.filter(
          nonNullish
        ) as CellChangeString[]) {
          const column = hot.propToCol(prop) as number;

          const itemId: number | null = hot.getDataAtRowProp(row, "itemId");
          if (itemId === null) {
            updateRowProp(hot, row, column, nextValue, prevValue);
          } else {
            const filters: PropFilter[] = [["itemId", itemId]];
            if (prop.startsWith("properties.")) {
              const guidProp = prop.replace(/\.value$/, ".guid");
              filters.push([guidProp, hot.getDataAtRowProp(row, guidProp)]);
            }

            const rowCount = hot.countRows();
            for (let row = 0; row < rowCount; row++) {
              if (rowMatchesFilters(hot, row, filters)) {
                updateRowProp(hot, row, column, prevValue, nextValue);
              }
            }
          }
        }
      },
    });

    hotRef.current = hot;

    return () => {
      hot.destroy();
      hotRef.current = null;
    };
  }, [tableStructure]);

  useEffect(() => {
    if (hotRef.current) {
      hotRef.current.loadData(data);
    }
  }, [data]);

  useImperativeHandle(ref, () => ({
    render() {
      hotRef.current?.render();
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
