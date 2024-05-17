import Handsontable from "handsontable";
import { ExportField, ExportParameters } from "./ExportDialog";
import {
  stringify,
  Callback as StringifyCallback,
} from "csv-stringify/browser/esm";
import { propertyToPath } from "src/localTable";

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
