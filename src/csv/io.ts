import Handsontable from "handsontable";
import { ExportField, ExportParameters } from "./ExportDialog";
import {
  stringify,
  Callback as StringifyCallback,
} from "csv-stringify/browser/esm";
import { parse as parseCsv } from "csv-parse/browser/esm/sync";
import { propertyToPath } from "src/localTable";
import { ImportField, ImportParameters } from "./ImportDialog";
import { DefaultMap } from "src/util";

function* iterRows(
  hot: Handsontable,
  fields: ExportField[]
): Generator<string[]> {
  yield fields.map((field) => field.csvName);

  const props = fields.map(({ field }) => propertyToPath(field.property));
  for (let row = 0; row < hot.countRows(); row++) {
    yield props.map((prop) => hot.getDataAtRowProp(row, prop));
  }
}

export function writeToCsv(
  hot: Handsontable,
  params: ExportParameters,
  callback: StringifyCallback
) {
  const writer = stringify({ delimiter: params.delimiter }, callback);

  for (const data of iterRows(hot, params.fields)) {
    writer.write(data);
  }
  writer.end();
}

interface CsvToProp {
  isKey: boolean;
  csvName: string;
  tableProp: string;
}

function updateRowFromCsv(
  hot: Handsontable,
  row: number,
  fields: CsvToProp[],
  csvRow: any
) {
  for (const field of fields) {
    if (field.tableProp === "itemId") {
      // itemId is immutable, trying to modify it will cause an exception
      continue;
    }

    hot.setDataAtRowProp(row, field.tableProp, csvRow[field.csvName]);
  }
}

export function applyCsv(
  hot: Handsontable,
  rawCsv: string,
  params: ImportParameters
) {
  const csv: any[] = parseCsv(rawCsv, { columns: true });

  const mapping = params.fields.map(({ isKey, csvName, hotMapping }) => ({
    isKey,
    csvName,
    tableProp: propertyToPath(hotMapping.property),
  }));
  const keysMapping = mapping.filter((field) => field.isKey);
  const fieldsMapping = mapping.filter((field) => !field.isKey);

  // Hash keyValues and map to row number
  const keyIndex = new DefaultMap<string, number[]>(() => []);
  for (let hotRow = 0; hotRow < hot.countRows(); hotRow++) {
    const keyValues = keysMapping.map((field) =>
      hot.getDataAtRowProp(hotRow, field.tableProp)
    );
    keyIndex.get(JSON.stringify(keyValues)).push(hotRow);
  }

  const newRows = csv.filter((csvRow) => {
    const keyValues = JSON.stringify(
      keysMapping.map((field) => csvRow[field.csvName])
    );
    if (keyIndex.has(keyValues)) {
      for (const row of keyIndex.get(keyValues)) {
        updateRowFromCsv(hot, row, fieldsMapping, csvRow);
      }
      return false;
    }

    return true;
  });

  let currentRow = hot.countRows();
  for (const csvRow of newRows) {
    hot.alter("insert_row_below");
    updateRowFromCsv(hot, currentRow++, mapping, csvRow);
  }
}
