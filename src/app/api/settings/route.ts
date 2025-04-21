import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Default settings by key
const DEFAULT_SETTINGS = {
  shipping_config: {
    freeShippingAreas: ['Cabusao', 'Del Gallego', 'Lupi', 'Ragay', 'Sipocot'],
    standardShippingFee: 500
  },
  shipping_map_config: {
    serviceAreaCenter: {
      lat: 13.6234, // Naga City coordinates
      lng: 123.1945
    },
    maxServiceDistance: 50,
    baseRate: 50,
    ratePerKm: 5
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json(
      { error: 'Key parameter is required' },
      { status: 400 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.log(`Settings not found for key "${key}", returning defaults`);
      // Return default values for this key
      return NextResponse.json(DEFAULT_SETTINGS[key] || {});
    }

    return NextResponse.json(data.value);
  } catch (error) {
    console.error('Exception in GET settings:', error);
    return NextResponse.json(DEFAULT_SETTINGS[key] || {});
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json(
      { error: 'Key parameter is required' },
      { status: 400 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  let value;

  try {
    value = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase.from('settings').upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'key'
      }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
