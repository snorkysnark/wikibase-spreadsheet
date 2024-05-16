import { useLocalStorageValue } from "@react-hookz/web";
import { produce } from "immer";
import { useMemo } from "react";
import { makeUuid } from "./util";

export function map<T, U>(
  m: OrderedMap<T>,
  callbackfn: (value: T, index: number) => U
): U[] {
  return m.order.map((uuid, index) => callbackfn(m.byUuid[uuid], index));
}

export interface OrderedMap<T> {
  order: string[];
  byUuid: { [uuid: string]: T };
}

export interface StructureSettings {
  isInstanceProperty: string | null;
  tables: OrderedMap<{
    definition: TableStructure;
    csvMappings: OrderedMap<CsvMapping>;
  }>;
}

export interface TableStructurePartial {
  name: string;
  parentItem: string;
  fields: TableField[];
}

export interface TableStructure extends TableStructurePartial {
  uuid: string;
}

interface CsvMapping {
  uuid: string;
  name: string;
  pairs: [fieldUuid: string, csvField: string][];
}

export interface TableField {
  uuid: string;
  name: string;
  property: string;
}

export interface SettingsActions {
  setInstanceProperty(value: string | null): void;
  addTable(data: TableStructurePartial): string;
  alterTable(uuid: string, data: TableStructurePartial): void;
  deleteTable(uuid: string): void;
}

export function useSettings(): [StructureSettings, SettingsActions] {
  const { value, set } = useLocalStorageValue("table-structure", {
    defaultValue: {
      isInstanceProperty: null,
      tables: { order: [], byUuid: {} },
    } as StructureSettings,
    initializeWithValue: true,
  });

  const actions = useMemo(
    () => ({
      setInstanceProperty(value: string | null) {
        set(
          produce((settings) => {
            settings.isInstanceProperty = value;
          })
        );
      },
      addTable(data: TableStructurePartial) {
        const uuid = makeUuid();

        set(
          produce((settings) => {
            settings.tables.byUuid[uuid] = {
              definition: { uuid, ...data },
              csvMappings: { order: [], byUuid: {} },
            };
            settings.tables.order.push(uuid);
          })
        );

        return uuid;
      },
      alterTable(uuid: string, data: TableStructurePartial) {
        set(
          produce((settings) => {
            settings.tables.byUuid[uuid].definition = { uuid, ...data };
          })
        );
      },
      deleteTable(uuid: string) {
        set(
          produce((settings) => {
            settings.tables.order = settings.tables.order.filter(
              (other) => other !== uuid
            );
            delete settings.tables.byUuid[uuid];
          })
        );
      },
    }),
    []
  );

  return [value, actions];
}
