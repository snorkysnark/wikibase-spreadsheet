import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { TableStructure } from "./structure";
import Handsontable from "handsontable";
import { CellMeta, CellProperties } from "node_modules/handsontable/settings";
import { nonNullish, unique } from "./util";
import { LocalRow } from "./localTable";

export interface TableEditorHandle {
  table: Handsontable | null;
  columnSettings: ColumnSettings[];
  addDefaultRow(): void;
  toggleRowDeletion(): void;
}

export interface ColumnSettings {
  name: string;
  prop: string;
}

type CellChangeString = [number, string, any, any];

function extendCellSettings(
  hot: Handsontable,
  settings: CellProperties,
  row: number,
  column: number,
  itemsForDeleteion: Set<number>
): CellMeta {
  const itemId = hot.getDataAtRowProp(row, "itemId");
  if (itemId === null) {
    return { className: "edited" }; // New row
  }

  if (itemsForDeleteion.has(itemId)) {
    return { className: "deleted", readOnly: true };
  }

  const originalValue = settings.originalValue;
  if (
    originalValue !== undefined &&
    originalValue !== hot.getDataAtCell(row, column)
  ) {
    return { className: "edited" };
  }

  return { className: undefined, readOnly: false };
}

function getSelectedRows(hot: Handsontable): number[] {
  const rows: number[] = [];

  hot.getSelectedRange()?.forEach((range) => {
    for (let row = range.from.row; row <= range.to.row; row++) {
      rows.push(row);
    }
  });

  return unique(rows.sort((a, b) => a - b));
}

function resetRowToOriginalValue(hot: Handsontable, row: number) {
  const colCount = hot.countCols();
  for (let column = 0; column < colCount; column++) {
    const originalValue = hot.getCellMeta(row, column).originalValue;
    if (originalValue !== undefined) {
      hot.setDataAtCell(row, column, originalValue, "auto");
    }
  }
}

const TableEditor = forwardRef(function TableEditor(
  {
    data,
    tableStructure,
  }: {
    data: LocalRow[];
    tableStructure: TableStructure;
  },
  ref: ForwardedRef<TableEditorHandle>
) {
  const container = useRef<HTMLDivElement | null>(null);
  const hotRef = useRef<Handsontable | null>(null);

  const itemsForDeletion = useRef(new Set<number>());

  const colSettings = useMemo<ColumnSettings[]>(
    () => [
      { name: "label", prop: "label.value" },
      ...tableStructure.fields.map((field) => ({
        name: field.name,
        prop: `properties.${field.property}.value`,
      })),
    ],
    [tableStructure]
  );

  useEffect(() => {
    itemsForDeletion.current.clear();

    const hot = new Handsontable(container.current!, {
      colHeaders: [...colSettings.map((col) => col.name)],
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
      columns: [...colSettings.map((col) => ({ data: col.prop }))],
      outsideClickDeselects: false,
      licenseKey: "non-commercial-and-evaluation",
    });
    hot.updateSettings({
      rowHeaders: (index) => {
        const itemId: number | null = hot.getDataAtRowProp(index, "itemId");
        return itemId !== null ? `Q${itemId}` : "?";
      },
      cells(row, column) {
        return extendCellSettings(
          hot,
          this,
          row,
          column,
          itemsForDeletion.current
        );
      },
      beforeChange(changes, source) {
        if (source !== "edit") return;

        for (const [row, prop, prevValue, nextValue] of changes.filter(
          nonNullish
        ) as CellChangeString[]) {
          const column = hot.propToCol(prop) as number;
          const originalValue = hot.getCellMeta(row, column).originalValue;

          hot.setDataAtCell(row, column, nextValue, "auto");
          hot.setCellMeta(
            row,
            column,
            "originalValue",
            originalValue ?? prevValue
          );
        }
      },
    });

    hotRef.current = hot;

    return () => {
      hot.destroy();
      hotRef.current = null;
    };
  }, [colSettings]);

  useEffect(() => {
    itemsForDeletion.current.clear();

    if (hotRef.current) {
      hotRef.current.loadData(data);
    }
  }, [data]);

  useImperativeHandle(ref, () => ({
    table: hotRef.current,
    columnSettings: colSettings,
    addDefaultRow() {
      const hot = hotRef.current;
      if (hot) {
        hot.alter("insert_row_below");

        const lastRow = hot.countRows() - 1;
        hot.setDataAtRowProp(lastRow, "label.value", crypto.randomUUID());
        hot.selectCell(lastRow, 0);
      }
    },
    toggleRowDeletion() {
      const hot = hotRef.current;
      if (hot) {
        const selectedRows = getSelectedRows(hot);

        // Iterate in reverse order
        for (let i = selectedRows.length - 1; i >= 0; i--) {
          const row = selectedRows[i];
          const itemId: number | null = hot.getDataAtRowProp(row, "itemId");

          if (itemId === null) {
            // New row
            hot.alter("remove_row", row);
          } else {
            // Existing row, mark for deletion
            if (itemsForDeletion.current.has(itemId)) {
              itemsForDeletion.current.delete(itemId);
            } else {
              itemsForDeletion.current.add(itemId);
              resetRowToOriginalValue(hot, row);
            }
          }
        }

        hot.render();
      }
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
