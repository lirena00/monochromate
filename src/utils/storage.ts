type MonofilterTypes = {
  enabled: boolean;
  intensity: number;
  blacklist: string[];
  scheduleStart: string;
  scheduleEnd: string;
  schedule: boolean;
  temporaryDisable: boolean;
  temporaryDisableUntil: number | null;
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
    },
    version: 1,
  }
);
