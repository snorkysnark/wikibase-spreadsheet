import Handsontable from "handsontable";
import { ExportParameters } from "./ExportDialog";
import {
  stringify,
  Callback as StringifyCallback,
} from "csv-stringify/browser/esm";

function* iterRows(hot: Handsontable, headers: boolean): Generator<string[]> {
  if (headers) {
    yield hot.getColHeader() as string[];
  }
  for (let row = 0; row < hot.countRows(); row++) {
    yield hot.getDataAtRow(row);
  }
}

export function writeToCsv(
  hot: Handsontable,
  params: ExportParameters,
  callback: StringifyCallback
) {
  const writer = stringify({ delimiter: params.delimiter }, callback);

  let itemIds: string[] | null = null;
  if (params.itemIds) {
    itemIds = hot.getRowHeader() as string[];
    if (params.headerRow) {
      itemIds.splice(0, 0, ""); // 1st header is empty
    }
  }

  let index = 0;
  for (const data of iterRows(hot, params.headerRow)) {
    if (itemIds) {
      data.splice(0, 0, itemIds[index++]);
    }
    writer.write(data);
  }

  writer.end();
}
