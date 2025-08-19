type MonofilterTypes_prev = {
  enabled: boolean;
  intensity: number;
  blacklist: string[];
  scheduleStart: string;
  scheduleEnd: string;
  schedule: boolean;
};
type MonofilterTypes = {
  enabled: boolean;
  intensity: number;
  blacklist: string[];
  scheduleStart: string;
  scheduleEnd: string;
  schedule: boolean;
  temporaryDisable: boolean;
  temporaryDisableUntil: number | null;
  mediaExceptionEnabled: boolean;
};

export const settings = storage.defineItem<MonofilterTypes>(
  "local:Monofilter",
  {
    fallback: {
      enabled: true,
      intensity: 100,
      blacklist: ["localhost"],
      scheduleStart: "17:00",
      scheduleEnd: "09:00",
      schedule: false,
      temporaryDisable: false,
      temporaryDisableUntil: null,
      mediaExceptionEnabled: false,
    },
    version: 2,
    migrations: {
      2: (oldValue: MonofilterTypes_prev): MonofilterTypes => {
        return {
          ...oldValue,
          temporaryDisable: false,
          temporaryDisableUntil: null,
          mediaExceptionEnabled: false,
        };
      },
    },
  }
);

export type Settings = MonofilterTypes;
