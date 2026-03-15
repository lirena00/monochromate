import { storage } from "#imports";

interface MonofilterTypes_v1 {
  blacklist: string[];
  enabled: boolean;
  intensity: number;
  schedule: boolean;
  scheduleEnd: string;
  scheduleStart: string;
}

interface MonofilterTypes_v2 {
  blacklist: string[];
  enabled: boolean;
  intensity: number;
  mediaExceptionEnabled: boolean;
  schedule: boolean;
  scheduleEnd: string;
  scheduleStart: string;
  temporaryDisable: boolean;
  temporaryDisableUntil: number | null;
}

interface MonofilterTypes_v3 {
  blacklist: string[];
  enabled: boolean;
  intensity: number;
  mediaExceptionEnabled: boolean;
  schedule: boolean;
  scheduleEnd: string;
  scheduleStart: string;
  temporaryDisable: boolean;
  temporaryDisableUntil: number | null;
  urlPatternBlacklist: string[];
}

interface MonofilterTypes {
  blacklist: string[];
  enabled: boolean;
  intensity: number;
  mediaExceptionEnabled: boolean;
  mode: "blacklist" | "whitelist";
  schedule: boolean;
  scheduleEnd: string;
  scheduleStart: string;
  temporaryDisable: boolean;
  temporaryDisableUntil: number | null;
  urlPatternBlacklist: string[];
  urlPatternWhitelist: string[];
  whitelist: string[];
}

export const settings = storage.defineItem<MonofilterTypes>(
  "local:Monofilter",
  {
    fallback: {
      enabled: true,
      intensity: 100,
      blacklist: ["localhost"],
      urlPatternBlacklist: [],
      whitelist: [],
      urlPatternWhitelist: [],
      mode: "blacklist",
      scheduleStart: "17:00",
      scheduleEnd: "09:00",
      schedule: false,
      temporaryDisable: false,
      temporaryDisableUntil: null,
      mediaExceptionEnabled: false,
    },
    version: 4,
    migrations: {
      2: (oldValue: MonofilterTypes_v1): MonofilterTypes_v2 => {
        return {
          ...oldValue,
          temporaryDisable: false,
          temporaryDisableUntil: null,
          mediaExceptionEnabled: false,
        };
      },
      3: (oldValue: MonofilterTypes_v2): MonofilterTypes_v3 => {
        return {
          ...oldValue,
          urlPatternBlacklist: [],
        };
      },
      4: (oldValue: MonofilterTypes_v3): MonofilterTypes => {
        return {
          ...oldValue,
          mode: "blacklist",
          whitelist: [],
          urlPatternWhitelist: [],
        };
      },
    },
  }
);

export type Settings = MonofilterTypes;
