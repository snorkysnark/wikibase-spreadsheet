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
import { SparqlTable } from "./wikibase/sparql";
import { CellChange } from "node_modules/handsontable/common";
import {
  CreationTask,
  DeletionTask,
  ItemChanges,
  NamedTask,
  PropertyChanges,
  UpdateTask,
} from "./uploadTasks";

export interface TableEditorHandle {
  addRow: () => void;
  toggleRowDeletion: () => void;
  getModifications: () => NamedTask[];
}

function addRow(hot: Handsontable) {
  hot.batch(() => {
    hot.alter("insert_row_below");
    const lastRow = hot.countRows() - 1;
    const numColumns = hot.countCols();

    // Set random unique label
    hot.setDataAtCell(lastRow, 0, crypto.randomUUID());

    for (let i = 0; i < numColumns; i++) {
      hot.setCellMeta(lastRow, i, "className", "edited");
    }

    hot.selectCell(lastRow, 0);
  });
}

function afterEdit(
  hot: Handsontable,
  changes: CellChange[],
  existingRows: number
) {
  for (const [row, prop, prevValue, nextValue] of changes) {
    if (row >= existingRows) continue;

    const column = hot.propToCol(prop as string) as number;

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
    isInstanceProp,
  }: {
    data: SparqlTable;
    tableStructure: TableStructure<string>;
    isInstanceProp: string;
  },
  ref: ForwardedRef<TableEditorHandle>
) {
  const container = useRef<HTMLDivElement | null>(null);
  const hotRef = useRef<Handsontable | null>(null);
  const rowsForDeletion = useRef(new Set<number>());
  const existingRows = useRef<number>(0);

  const parentItemId = useMemo(() => {
    const match = /Q(\d+)/.exec(tableStructure.parentItem);
    if (!match)
      throw new Error("Incorrect item id " + tableStructure.parentItem);
    return +match[1];
  }, [tableStructure]);

  useEffect(() => {
    const hot = new Handsontable(container.current!, {
      colHeaders: [
        "label",
        ...tableStructure.fields.map((field) => field.name),
      ],
      rowHeaders: (index) =>
        index < existingRows.current ? data.rows[index].item : "?",
      data: data.rows,
      dataSchema: {
        item: null,
        label: null,
        properties: Object.fromEntries(
          data.properties.map((propertyId) => [
            propertyId,
            { guid: null, value: null },
          ])
        ),
      },
      columns: [
        { data: "label" },
        ...data.properties.map((propertyId) => ({
          data: `properties.${propertyId}.value`,
        })),
      ],
      outsideClickDeselects: false,
      licenseKey: "non-commercial-and-evaluation",
    });
    hot.updateSettings({
      afterChange: (changes, source) => {
        if (source === "edit" && changes) {
          afterEdit(hot, changes, existingRows.current);
        }
      },
    });

    hotRef.current = hot;
    existingRows.current = data.rows.length;

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
          if (row < existingRows.current) {
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
    getModifications: () => {
      const modifications: NamedTask[] = [];

      const hot = hotRef.current;
      if (hot) {
        const changedItems = new Map<
          string,
          { label?: string; properties: Map<string, PropertyChanges> }
        >();

        for (let row = 0; row < existingRows.current; row++) {
          for (const meta of hot.getCellMetaAtRow(row)) {
            if (!meta.edited) continue;

            const value = hot.getDataAtCell(meta.row, meta.col);
            const itemId = data.rows[row].item;
            const propParts = (meta.prop as string).split(".");

            if (!changedItems.has(itemId))
              changedItems.set(itemId, { properties: new Map() });
            const changes = changedItems.get(itemId)!;

            switch (propParts[0]) {
              case "label":
                changes.label = value;
                break;
              case "properties":
                const property = propParts[1];
                const guid = hot.getDataAtRowProp(
                  row,
                  [...propParts.slice(0, propParts.length - 1), "guid"].join(
                    "."
                  )
                );
                changes.properties.set(`${guid}-${property}`, {
                  guid,
                  property,
                  value,
                });
            }
          }
        }

        for (const [itemId, { label, properties }] of changedItems.entries()) {
          modifications.push(
            new UpdateTask(itemId, {
              label,
              properties: [...properties.values()],
            })
          );
        }

        for (let row = existingRows.current; row < hot.countRows(); row++) {
          const changes: ItemChanges = {
            label: hot.getDataAtRowProp(row, "label"),
            properties: tableStructure.fields
              .map((field) => ({
                property: field.property,
                value: hot.getDataAtRowProp(
                  row,
                  `properties.${field.property}.value`
                ),
              }))
              .filter(({ value }) => value !== null),
          };
          modifications.push(
            new CreationTask(changes, isInstanceProp, parentItemId)
          );
        }

        const usedIds = new Set<string>();
        for (const row of rowsForDeletion.current) {
          const itemId = hot.getDataAtRowProp(row, "item");
          if (!usedIds.has(itemId)) {
            modifications.push(new DeletionTask(itemId));
            usedIds.add(itemId);
          }
        }
      }
      return modifications;
    },
  }));

  return <div ref={container}></div>;
});

export default TableEditor;
