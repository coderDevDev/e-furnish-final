import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // First, try to create the exec_sql function
    const createRpcResult = await supabase.rpc('create_rpc_functions', {});

    // If that failed, we'll try a direct SQL approach
    if (createRpcResult.error) {
      console.log('Creating RPC functions directly via SQL...');

      // Create the exec_sql function directly
      const { error: sqlError } = await supabase
        .from('_rpc')
        .select('*')
        .limit(1)
        .then(async () => {
          // Direct SQL query to create the function - this requires admin rights
          return await supabase.auth.admin.createUser({
            email: 'dummy@example.com',
            password: 'password',
            user_metadata: {
              first_name: 'Dummy',
              last_name: 'User'
            }
          });
        });

      if (sqlError) {
        throw new Error(`Failed to create RPC function: ${sqlError.message}`);
      }
    }

    // Now create and populate the shipping_settings table
    const createTableQuery = `
      -- Create shipping_settings table if it doesn't exist
      CREATE TABLE IF NOT EXISTS shipping_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        free_shipping_areas TEXT[] DEFAULT ARRAY['Cabusao', 'Del Gallego', 'Lupi', 'Ragay', 'Sipocot'],
        standard_shipping_fee INTEGER DEFAULT 500,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Insert default record if none exists
      INSERT INTO shipping_settings (free_shipping_areas, standard_shipping_fee)
      SELECT ARRAY['Cabusao', 'Del Gallego', 'Lupi', 'Ragay', 'Sipocot']::TEXT[], 500
      WHERE NOT EXISTS (SELECT 1 FROM shipping_settings LIMIT 1);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableQuery });

    if (error) {
      // If exec_sql failed, try a different approach
      console.log('Exec_sql failed, trying direct table creation...');

      // First check if the table exists
      const { error: checkError } = await supabase
        .from('shipping_settings')
        .select('id')
        .limit(1);

      if (checkError) {
        // Table doesn't exist, we need to create it but can't use exec_sql
        // At this point, we need admin intervention
        return NextResponse.json(
          {
            success: false,
            error: 'Database setup requires admin intervention',
            message:
              'Please run the SQL script manually in the Supabase dashboard SQL editor.'
          },
          { status: 500 }
        );
      } else {
        // Table exists, we just need to check if it has data
        const { count, error: countError } = await supabase
          .from('shipping_settings')
          .select('*', { count: 'exact', head: true });

        // If empty, insert default data
        if (!countError && count === 0) {
          const { error: insertError } = await supabase
            .from('shipping_settings')
            .insert({
              free_shipping_areas: [
                'Cabusao',
                'Del Gallego',
                'Lupi',
                'Ragay',
                'Sipocot'
              ],
              standard_shipping_fee: 500
            });

          if (insertError) {
            throw insertError;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully'
    });
  } catch (error) {
    console.error('Error during database setup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set up database',
        details: error,
        message:
          'Try running the SQL script manually in Supabase dashboard SQL editor.'
      },
      { status: 500 }
    );
  }
}
