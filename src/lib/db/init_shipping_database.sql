-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the exec_sql RPC function first (this is needed by your setup API)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

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