import fs from 'fs';
import path from 'path';

const BASE_URL =
  'https://raw.githubusercontent.com/juanflaco/philippines-json/master';
const OUTPUT_DIR = path.join(process.cwd(), 'public/data/philippines');

async function fetchAndSave(url: string, outputPath: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${url}`);

    const data = await response.json();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`Saved: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
  }
}

async function main() {
  try {
    // Fetch regions
    await fetchAndSave(
      `${BASE_URL}/regions.json`,
      path.join(OUTPUT_DIR, 'regions.json')
    );

    // Fetch provinces for each region
    const regions = require('../src/data/philippines/regions').regions;
    for (const region of regions) {
      await fetchAndSave(
        `${BASE_URL}/region/${region.id}/provinces.json`,
        path.join(OUTPUT_DIR, region.id, 'provinces.json')
      );
    }

    // Fetch cities and barangays
    const provinces = fs
      .readdirSync(path.join(OUTPUT_DIR))
      .filter(f => f.endsWith('.json'))
      .map(f => require(path.join(OUTPUT_DIR, f)));

    for (const province of provinces) {
      await fetchAndSave(
        `${BASE_URL}/province/${province.id}/cities.json`,
        path.join(OUTPUT_DIR, 'provinces', province.id, 'cities.json')
      );

      const cities = require(path.join(
        OUTPUT_DIR,
        'provinces',
        province.id,
        'cities.json'
      ));
      for (const city of cities) {
        await fetchAndSave(
          `${BASE_URL}/city/${city.id}/barangays.json`,
          path.join(OUTPUT_DIR, 'cities', city.id, 'barangays.json')
        );
      }
    }

    console.log('Successfully fetched all location data');
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main().catch(console.error);
