declare module 'select-philippines-address' {
  interface Region {
    id: number;
    psgc_code: string;
    region_name: string;
    region_code: string;
  }

  interface Province {
    psgc_code: string;
    province_name: string;
    province_code: string;
    region_code: string;
  }

  interface City {
    city_code: string;
    city_name: string;
    province_code: string;
    psgc_code: string;
    region_desc: string;
  }

  interface Barangay {
    brgy_name: string;
    brgy_code: string;
    province_code: string;
    region_code: string;
  }

  export function regions(): Promise<Region[]>;
  export function provinces(regionCode: string): Promise<Province[]>;
  export function cities(provinceCode: string): Promise<City[]>;
  export function barangays(cityCode: string): Promise<Barangay[]>;
}
