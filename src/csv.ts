import Handsontable from "handsontable";
import { TableEditorHandle } from "./TableEditor";
import { DefaultMap } from "./util";

export const DEFAULT_CSV_MAP: CsvField[] = [
  {
    csvName: "label",
    wikidataProp: "label.value",
    isKey: true,
  },
  {
    csvName: "University",
    wikidataProp: "properties.P3.value",
    isKey: true,
  },
  {
    csvName: "Rank",
    wikidataProp: "properties.P4.value",
  },
  {
    csvName: "Page",
    wikidataProp: "properties.P2.value",
  },
  {
    csvName: "Country",
    wikidataProp: "properties.P5.value",
  },
];

export interface CsvField {
  csvName: string;
  wikidataProp: string;
  isKey?: boolean;
}

function updateRowFromCsv(
  hot: Handsontable,
  row: number,
  fields: CsvField[],
  csvRow: any
) {
  for (const field of fields) {
    hot.setDataAtRowProp(row, field.wikidataProp, csvRow[field.csvName]);
  }
}

export async function applyCsv(
  hot: TableEditorHandle,
  csv: any[],
  mapping: CsvField[]
) {
  if (!hot.table) return;

  const keysMapping = mapping.filter((field) => field.isKey);
  const fieldsMapping = mapping.filter((field) => !field.isKey);

  const keyIndex = new DefaultMap<string, number[]>(() => []);
  for (let hotRow = 0; hotRow < hot.table.countRows(); hotRow++) {
    const keyValues = keysMapping.map((field) =>
      hot.table!.getDataAtRowProp(hotRow, field.wikidataProp)
    );
    keyIndex.get(JSON.stringify(keyValues)).push(hotRow);
  }

  const newRows = csv.filter((csvRow) => {
    const keyValues = JSON.stringify(
      keysMapping.map((field) => csvRow[field.csvName])
    );
    if (keyIndex.has(keyValues)) {
      for (const row of keyIndex.get(keyValues)) {
        updateRowFromCsv(hot.table!, row, fieldsMapping, csvRow);
      }
      return false;
    }

    return true;
  });

  let currentRow = hot.table.countRows();
  for (const csvRow of newRows) {
    hot.table.alter("insert_row_below");
    updateRowFromCsv(hot.table, currentRow++, mapping, csvRow);
  }
}
