-- Function to create shipping settings table
CREATE OR REPLACE FUNCTION create_shipping_settings_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'shipping_settings'
  ) THEN
    -- Create the shipping_settings table
    CREATE TABLE public.shipping_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      free_shipping_areas TEXT[] NOT NULL DEFAULT '{"Cabusao", "Del Gallego", "Lupi", "Ragay", "Sipocot"}',
      standard_shipping_fee NUMERIC NOT NULL DEFAULT 500,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insert default settings
    INSERT INTO public.shipping_settings (
      free_shipping_areas, 
      standard_shipping_fee
    ) VALUES (
      ARRAY['Cabusao', 'Del Gallego', 'Lupi', 'Ragay', 'Sipocot'],
      500
    );
  END IF;
END;
$$; 