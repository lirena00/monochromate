type MonofilterTypes_prev = {
  enabled: boolean;
  intensity: number;
  blacklist: string[];
  scheduleStart: string;
  scheduleEnd: string;
  schedule: boolean;

};
type MonofilterTypes= {
  enabled: boolean;
  intensity: number;
  blacklist: string[];
  scheduleStart: string;
  scheduleEnd: string;
  schedule: boolean;
  skipMediaPage:boolean
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
      skipMediaPage:true,

    },
    version: 2,
    migrations:{
      2:(oldValue:MonofilterTypes_prev):MonofilterTypes=>{
        return{
          ...oldValue,
          skipMediaPage:true
          
        }
      }
    }
  }
  
);

export type Settings=MonofilterTypes;