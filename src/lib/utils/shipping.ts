// Define the municipalities in the First District of Camarines Sur
export const FIRST_DISTRICT_MUNICIPALITIES = [
  'Cabusao',
  'Del Gallego',
  'Lupi',
  'Ragay',
  'Sipocot'
];

/**
 * Checks if an address qualifies for free shipping based on municipality
 */
export function isEligibleForFreeShipping(municipalityName: string): boolean {
  // Convert to lowercase and trim for case-insensitive comparison
  const normalizedMunicipality = municipalityName?.trim().toLowerCase();

  return FIRST_DISTRICT_MUNICIPALITIES.some(
    municipality => municipality.toLowerCase() === normalizedMunicipality
  );
}

/**
 * Calculate shipping cost based on delivery address
 */
export function calculateShippingCost(address: {
  province_name?: string;
  city_name?: string;
}): number {
  // No address means default shipping rate
  if (!address?.city_name || !address?.province_name) {
    return 500;
  }

  // First check if it's in Camarines Sur province
  if (address.province_name.toLowerCase().includes('camarines sur')) {
    // Check if the city is in the first district (case-insensitive)
    const cityLower = address.city_name.toLowerCase().trim();
    if (
      FIRST_DISTRICT_MUNICIPALITIES.map(m => m.toLowerCase()).includes(
        cityLower
      )
    ) {
      return 0; // Free shipping
    }
  }

  // Default shipping fee for other areas
  return 500;
}

// Add this function to load settings from the database
export async function loadShippingSettings(): Promise<void> {
  try {
    const settings = await shippingService.getShippingSettings();
    // Update the constants based on database settings
    // This is tricky because constants can't be reassigned
    // One approach is to use these settings directly in the calculation function
  } catch (error) {
    console.error('Error loading shipping settings:', error);
  }
}
