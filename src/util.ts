export function nonNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export class DefaultMap<K, V> extends Map<K, V> {
  defaultFactory: () => V;

  constructor(defaultFactory: () => V) {
    super();
    this.defaultFactory = defaultFactory;
  }

  get(key: K): V {
    let value = super.get(key);
    if (value === undefined) {
      value = this.defaultFactory();
      this.set(key, value);
    }

    return value;
  }
}

export function saveToFile(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/plain" });
  const blobUrl = URL.createObjectURL(blob);

  const tmpLink = document.createElement("a");
  tmpLink.setAttribute("href", blobUrl);
  tmpLink.setAttribute("download", filename);
  tmpLink.click();

  URL.revokeObjectURL(blobUrl);
}
