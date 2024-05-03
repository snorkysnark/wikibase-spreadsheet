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
import { nonNullish } from "./util";
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

function getSelectedItems(
  hot: Handsontable
): [itemIds: Set<number>, newRows: Set<number>] {
  const itemIds = new Set<number>();
  const newRows = new Set<number>();

  hot.getSelectedRange()?.forEach((range) => {
    for (let row = range.from.row; row <= range.to.row; row++) {
      const itemId = hot.getDataAtRowProp(row, "itemId");

      if (itemId !== null) {
        itemIds.add(itemId);
      } else {
        newRows.add(row);
      }
    }
  });

  return [itemIds, newRows];
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
    tableStructure: TableStructure<string>;
  },
  ref: ForwardedRef<TableEditorHandle>
) {
  const container = useRef<HTMLDivElement | null>(null);
  const hotRef = useRef<Handsontable | null>(null);

  const itemsForDeleteion = useRef(new Set<number>());

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
    itemsForDeleteion.current.clear();

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
          itemsForDeleteion.current
        );
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
  }, [colSettings]);

  useEffect(() => {
    itemsForDeleteion.current.clear();

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
        const [itemIds, newRows] = getSelectedItems(hot);

        // Remove in reversed order
        for (const row of [...newRows].sort((a, b) => b - a)) {
          hot.alter("remove_row", row);
        }

        // Mark for deletion
        for (const itemId of itemIds) {
          if (itemsForDeleteion.current.has(itemId)) {
            itemsForDeleteion.current.delete(itemId);
          } else {
            itemsForDeleteion.current.add(itemId);
          }
        }
        for (let row = 0; row < hot.countRows(); row++) {
          if (
            itemsForDeleteion.current.has(hot.getDataAtRowProp(row, "itemId"))
          ) {
            resetRowToOriginalValue(hot, row);
          }
        }

        hot.render();
      }
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
