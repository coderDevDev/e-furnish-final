import {
  regions as getRegions,
  provinces,
  cities,
  barangays
} from 'select-philippines-address';

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Province {
  id: string;
  name: string;
  region_code: string;
  code: string;
}

export interface City {
  id: string;
  name: string;
  province_code: string;
  code: string;
}

export interface Barangay {
  id: string;
  name: string;
  city_code: string;
  code: string;
}

export const locationService = {
  async getRegions(): Promise<Region[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    // Call getRegions() as a function to get the array
    const regionList = await getRegions();

    console.log({ regionList });
    return regionList.map(region => ({
      id: region.region_code,
      name: region.region_name,
      code: region.region_code
    }));
  },

  async getProvinces(regionCode: string): Promise<Province[]> {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const regionProvinces = await provinces(regionCode);
      return regionProvinces.map(province => ({
        id: province.province_code,
        name: province.province_name,
        region_code: regionCode,
        code: province.province_code
      }));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  async getCities(provinceCode: string): Promise<City[]> {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const provinceCities = await cities(provinceCode);
      return provinceCities.map(city => ({
        id: city.city_code,
        name: city.city_name,
        province_code: provinceCode,
        code: city.city_code
      }));
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  },

  async getBarangays(cityCode: string): Promise<Barangay[]> {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const cityBarangays = await barangays(cityCode);
      return cityBarangays.map(barangay => ({
        id: barangay.brgy_code,
        name: barangay.brgy_name,
        city_code: cityCode,
        code: barangay.brgy_code
      }));
    } catch (error) {
      console.error('Error fetching barangays:', error);
      return [];
    }
  }
};
