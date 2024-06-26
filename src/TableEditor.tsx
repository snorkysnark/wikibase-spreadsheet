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
import {
  CellMeta,
  CellProperties,
  ColumnSettings,
} from "node_modules/handsontable/settings";
import { makeUuid, nonNullish, unique } from "./util";
import { LocalRow, itemIdFromUri, propertyToPath } from "./localTable";
import {
  CreationTask,
  DeletionTask,
  ItemChanges,
  NamedTask,
  UpdateTask,
} from "./uploadTasks";

export interface TableEditorHandle {
  table: Handsontable | null;
  columnSettings: ColumnSettings[];
  addDefaultRow(): void;
  toggleRowDeletion(): void;
  getModifications(): NamedTask[];
}

type CellChangeString = [number, string, any, any];

function cellIsEdited(
  hot: Handsontable,
  meta: CellMeta,
  row: number,
  column: number
): boolean {
  const originalValue = meta.originalValue;
  let currentValue = hot.getDataAtCell(row, column);
  if (currentValue === "") {
    // In handsontable, empty string and null are identical
    currentValue = null;
  }

  return originalValue !== undefined && originalValue !== currentValue;
}

function extendCellSettings(
  hot: Handsontable,
  settings: CellProperties,
  row: number,
  column: number,
  itemsForDeleteion: Set<string>
): CellMeta {
  const itemId: string | null = hot.getDataAtRowProp(row, "itemId");
  if (itemId === null) {
    return { className: "edited" }; // New row
  }

  if (itemsForDeleteion.has(itemId)) {
    return { className: "deleted", readOnly: true };
  }

  if (cellIsEdited(hot, settings, row, column)) {
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

interface ColumnSettingsExtended {
  name: string;
  datatype?: string;
  settings: ColumnSettings;
}

function* getUpdateTasks(
  hot: Handsontable,
  colSettings: ColumnSettingsExtended[],
  existingRows: number
): Generator<UpdateTask> {
  for (let row = 0; row < existingRows; row++) {
    const itemId = hot.getDataAtRowProp(row, "itemId");

    let changes: ItemChanges | null = null;

    for (const meta of hot.getCellMetaAtRow(row)) {
      if (!cellIsEdited(hot, meta, row, meta.col)) continue;
      if (!changes) changes = { properties: [] };

      const value = hot.getDataAtCell(meta.row, meta.col);
      const propParts = (meta.prop as string).split(".");

      switch (propParts[0]) {
        case "label":
          changes.label = value;
          break;
        case "description":
          changes.description = value;
          break;
        case "aliases":
          changes.aliases = value;
          break;
        case "properties":
          const property = propParts[1];
          const guid = hot.getDataAtRowProp(
            row,
            [...propParts.slice(0, propParts.length - 1), "guid"].join(".")
          );
          changes.properties.push({
            guid,
            property,
            value,
            datatype: colSettings[meta.col].datatype,
          });
      }
    }

    if (changes) yield new UpdateTask(itemId, changes);
  }
}

function getHandsontableDatatype(wikibaseType: string | undefined) {
  switch (wikibaseType) {
    case "quantity":
      return "numeric";
    default:
      return "text";
  }
}

const TableEditor = forwardRef(function TableEditor(
  {
    data,
    tableStructure,
    isInstanceProp,
  }: {
    data: LocalRow[];
    tableStructure: TableStructure;
    isInstanceProp: string;
  },
  ref: ForwardedRef<TableEditorHandle>
) {
  const container = useRef<HTMLDivElement | null>(null);
  const hotRef = useRef<Handsontable | null>(null);

  const itemsForDeletion = useRef(new Set<string>());
  const existingRows = useRef(0);

  const colSettings = useMemo<ColumnSettingsExtended[]>(
    () =>
      tableStructure.fields.map((field) => {
        return {
          name: field.name,
          datatype: field.datatype,
          settings: {
            data: propertyToPath(field.property),
            type: getHandsontableDatatype(field.datatype),
          },
        };
      }),
    [tableStructure]
  );

  useEffect(() => {
    itemsForDeletion.current.clear();

    const hot = new Handsontable(container.current!, {
      colHeaders: [...colSettings.map(({ name }) => name)],
      data,
      dataSchema: {
        itemId: null,
        label: null,
        description: null,
        aliases: null,
        properties: Object.fromEntries(
          tableStructure.fields.map((field) => [
            field.property,
            { guid: null, value: null },
          ])
        ),
      },
      columns: [...colSettings.map(({ settings }) => settings)],
      outsideClickDeselects: false,
      licenseKey: "non-commercial-and-evaluation",
    });
    hot.updateSettings({
      rowHeaders: (index) => {
        const itemId: string | null = hot.getDataAtRowProp(index, "itemId");
        return itemId !== null ? itemId : "?";
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

          if (originalValue === undefined) {
            hot.setCellMeta(row, column, "originalValue", prevValue);
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
    itemsForDeletion.current.clear();
    existingRows.current = data.length;

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
          const itemId: string | null = hot.getDataAtRowProp(row, "itemId");

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
    getModifications() {
      const modifications: NamedTask[] = [];

      const hot = hotRef.current;
      if (hot) {
        const parentItemId = itemIdFromUri(tableStructure.parentItem);

        modifications.push(
          ...getUpdateTasks(hot, colSettings, existingRows.current)
        );
        for (let row = existingRows.current; row < hot.countRows(); row++) {
          const changes: ItemChanges = {
            label: hot.getDataAtRowProp(row, "label"),
            description: hot.getDataAtRowProp(row, "description"),
            aliases: hot.getDataAtRowProp(row, "aliases"),
            properties: tableStructure.fields
              .filter((field) => field.property.startsWith("P"))
              .map((field) => ({
                property: field.property,
                value: hot.getDataAtRowProp(
                  row,
                  `properties.${field.property}.value`
                ),
                datatype: field.datatype,
              }))
              .filter(({ value }) => value !== null),
          };
          modifications.push(
            new CreationTask(changes, isInstanceProp, parentItemId)
          );
        }

        for (const itemId of itemsForDeletion.current) {
          modifications.push(new DeletionTask(itemId));
        }
      }

      return modifications;
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
