type MonofilterTypes = {
  enabled: boolean;
  intensity: number;
  blacklist: string[];
  scheduleStart: string;
  scheduleEnd: string;
  schedule: boolean;
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
    },
    version: 1,
  }
);
