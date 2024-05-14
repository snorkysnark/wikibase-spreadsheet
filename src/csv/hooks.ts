import { useAsync } from "@react-hookz/web";
import { parse as parseCsv } from "csv-parse/browser/esm/sync";
import { useEffect } from "react";

export function useCsvHeaders(
  file: File | null,
  delimiter: string
): string[] | null {
  const [{ result }, headerAction] = useAsync<
    string[] | null,
    [File | null, string]
  >(async (file: File | null, delimiter: string) => {
    if (!file) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const csv = reader.result as string;
        const firstLineEnd = csv.indexOf("\n");
        resolve(
          parseCsv(
            csv.substring(0, firstLineEnd >= 0 ? firstLineEnd : undefined),
            { delimiter: delimiter }
          )[0]
        );
      };
      reader.onerror = reject;
    });
  }, null);
  useEffect(() => {
    headerAction.execute(file, delimiter);
  }, [file, delimiter]);

  return result;
}
