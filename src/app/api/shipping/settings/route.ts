import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const DEFAULT_SHIPPING_SETTINGS = {
  freeShippingAreas: ['Cabusao', 'Del Gallego', 'Lupi', 'Ragay', 'Sipocot'],
  standardShippingFee: 500
};

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Check if the table exists first by trying a count query
    const { count, error: countError } = await supabase
      .from('shipping_settings')
      .select('*', { count: 'exact', head: true });

    // If there's an error or no records, return default settings
    if (countError || count === 0) {
      console.log('No shipping settings found, returning defaults');
      return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);
    }

    // Get the settings
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.log('Error fetching shipping settings, returning defaults');
      return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);
    }

    return NextResponse.json({
      freeShippingAreas:
        data.free_shipping_areas || DEFAULT_SHIPPING_SETTINGS.freeShippingAreas,
      standardShippingFee:
        data.standard_shipping_fee ||
        DEFAULT_SHIPPING_SETTINGS.standardShippingFee
    });
  } catch (error) {
    console.error('Exception in GET shipping settings:', error);
    return NextResponse.json(DEFAULT_SHIPPING_SETTINGS);
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const data = await request.json();

  try {
    // Check if the table exists by trying to select from it
    const { data: existingSettings, error: checkError } = await supabase
      .from('shipping_settings')
      .select('id')
      .limit(1)
      .single();

    // If there's an error that's not just "no rows found", it might be that the table doesn't exist
    if (checkError && checkError.code !== 'PGRST116') {
      // Create the table
      await supabase.rpc('create_shipping_settings_table');
    }

    // Either update existing record or insert new one
    const { error } = await supabase.from('shipping_settings').upsert({
      id: existingSettings?.id,
      free_shipping_areas: data.freeShippingAreas,
      standard_shipping_fee: data.standardShippingFee,
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update shipping settings',
        details: error
      },
      { status: 500 }
    );
  }
}
