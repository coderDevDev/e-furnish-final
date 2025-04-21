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
SELECT ARRAY['Cabusao', 'Del Gallego', 'Lupi', 'Ragay', 'Sipocot'], 500
WHERE NOT EXISTS (SELECT 1 FROM shipping_settings LIMIT 1); 