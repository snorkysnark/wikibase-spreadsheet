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

export interface CsvMappingPartial {
  name: string;
  delimiter: string;
  pairs: FieldMapping[];
}

export interface CsvMapping extends CsvMappingPartial {
  uuid: string;
}

export interface FieldMapping {
  isKey: boolean;
  fieldUuid: string;
  csvField: string;
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
  addMapping(tableUuid: string, mapping: CsvMappingPartial): string;
  updateMapping(
    tableUuid: string,
    mappingUuid: string,
    mapping: CsvMappingPartial
  ): void;
  deleteMapping(tableUuid: string, mappingUuid: string): void;
}

export function useSettings(): [StructureSettings, SettingsActions] {
  const { value, set } = useLocalStorageValue("table-structure", {
    defaultValue: {
      isInstanceProperty: null,
      tables: { order: [], byUuid: {} },
    } as StructureSettings,
    initializeWithValue: true,
  });

  const actions: SettingsActions = useMemo(
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
      alterTable(uuid, data) {
        set(
          produce((settings) => {
            settings.tables.byUuid[uuid].definition = { uuid, ...data };
          })
        );
      },
      deleteTable(uuid) {
        set(
          produce((settings) => {
            settings.tables.order = settings.tables.order.filter(
              (other) => other !== uuid
            );
            delete settings.tables.byUuid[uuid];
          })
        );
      },
      addMapping(tableUuid, mapping) {
        const uuid = makeUuid();

        set(
          produce((settings) => {
            const mappings = settings.tables.byUuid[tableUuid].csvMappings;
            mappings.byUuid[uuid] = {
              uuid,
              ...mapping,
            };
            mappings.order.push(uuid);
          })
        );
        return uuid;
      },
      updateMapping(tableUuid, mappingUuid, mapping) {
        set(
          produce((settings) => {
            const mappings = settings.tables.byUuid[tableUuid].csvMappings;
            mappings.byUuid[mappingUuid] = { uuid: mappingUuid, ...mapping };
          })
        );
      },
      deleteMapping(tableUuid: string, mappingUuid: string) {
        set(
          produce((settings) => {
            const mappings = settings.tables.byUuid[tableUuid].csvMappings;
            delete mappings.byUuid[mappingUuid];
            mappings.order = mappings.order.filter(
              (uuid) => uuid !== mappingUuid
            );
          })
        );
      },
    }),
    []
  );

  return [value, actions];
}

export interface CsvMappingActions {
  add(mapping: CsvMappingPartial): string;
  update(mappingUuid: string, mapping: CsvMappingPartial): void;
  delete(mappingUuid: string): void;
}

export function useMappings(
  settings: StructureSettings,
  alterSettings: SettingsActions,
  tableUuid: string | null
): [OrderedMap<CsvMapping> | null, CsvMappingActions | null] {
  const mappings = useMemo(() => {
    return tableUuid ? settings.tables.byUuid[tableUuid].csvMappings : null;
  }, [settings, tableUuid]);

  const actions: CsvMappingActions | null = useMemo(() => {
    if (!tableUuid) return null;

    return {
      add(mapping) {
        return alterSettings.addMapping(tableUuid, mapping);
      },
      update(mappingUuid, mapping) {
        alterSettings.updateMapping(tableUuid, mappingUuid, mapping);
      },
      delete(mappingUuid) {
        alterSettings.deleteMapping(tableUuid, mappingUuid);
      },
    };
  }, [alterSettings, tableUuid]);

  return [mappings, actions];
}
