'use client';

import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  Map as MapIcon,
  AlertTriangle,
  Truck,
  MapPin,
  Plus,
  X,
  RefreshCw
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SHIPPING_CONFIG } from '@/config/shipping';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FIRST_DISTRICT_MUNICIPALITIES } from '@/lib/utils/shipping';
import { shippingService } from '@/lib/services/shippingService';

// Add this at the top of your file, after your imports
declare global {
  interface Window {
    mapboxgl: any;
  }
}

// Form validation schema
const shippingFormSchema = z.object({
  baseRate: z.coerce
    .number()
    .min(1, 'Base rate must be at least ₱1')
    .max(1000, 'Base rate must not exceed ₱1000'),
  ratePerKm: z.coerce
    .number()
    .min(1, 'Rate per km must be at least ₱1')
    .max(100, 'Rate per km must not exceed ₱100'),
  maxServiceDistance: z.coerce
    .number()
    .min(1, 'Maximum service distance must be at least 1 km')
    .max(100, 'Maximum service distance must not exceed 100 km'),
  serviceAreaCenterLat: z.coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  serviceAreaCenterLng: z.coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const ShippingSettings = () => {
  const [freeShippingAreas, setFreeShippingAreas] = useState<string[]>(
    FIRST_DISTRICT_MUNICIPALITIES
  );
  const [standardShippingFee, setStandardShippingFee] = useState<number>(500);
  const [newMunicipality, setNewMunicipality] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const supabase = createClientComponentClient();
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredMunicipality, setHoveredMunicipality] = useState<string | null>(
    null
  );

  // Load shipping settings from database on component mount
  useEffect(() => {
    const loadShippingSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await shippingService.getShippingSettings();
        setFreeShippingAreas(settings.freeShippingAreas);
        setStandardShippingFee(settings.standardShippingFee);
      } catch (error) {
        console.error('Error loading shipping settings:', error);
        toast.error('Failed to load shipping settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadShippingSettings();
  }, []);

  // Define the loadSettings function at the component level
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'shipping_map_config')
        .single();

      if (error) {
        console.log('Error loading settings:', error);
        return {
          serviceAreaCenterLat: 13.6234,
          serviceAreaCenterLng: 123.1945,
          maxServiceDistance: 50,
          baseRate: 50,
          ratePerKm: 5
        };
      }

      const settings = data?.value || {};
      const serviceAreaCenter = settings.serviceAreaCenter || {
        lat: 13.6234,
        lng: 123.1945
      };

      return {
        serviceAreaCenterLat: serviceAreaCenter.lat,
        serviceAreaCenterLng: serviceAreaCenter.lng,
        maxServiceDistance: settings.maxServiceDistance || 50,
        baseRate: settings.baseRate || 50,
        ratePerKm: settings.ratePerKm || 5
      };
    } catch (error) {
      console.error('Error parsing settings:', error);
      return {
        serviceAreaCenterLat: 13.6234,
        serviceAreaCenterLng: 123.1945,
        maxServiceDistance: 50,
        baseRate: 50,
        ratePerKm: 5
      };
    }
  };

  // Now loadMapbox can access loadSettings
  const loadMapbox = async () => {
    try {
      if (!window.mapboxgl) {
        console.error('Mapbox GL JS not loaded');
        setMapError(
          'Mapbox could not be loaded. Please check your internet connection and API key.'
        );
        return;
      }

      const settings = await loadSettings();

      // Make sure we have valid coordinates
      const lat = settings.serviceAreaCenterLat || 13.6234;
      const lng = settings.serviceAreaCenterLng || 123.1945;

      // Add a try-catch around map initialization
      try {
        const mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [lng, lat],
          zoom: 9,
          attributionControl: false
        });

        setMap(mapInstance);
      } catch (mapError) {
        console.error('Error initializing map:', mapError);
        setMapError(
          'Could not initialize map. Please try refreshing the page.'
        );
      }
    } catch (error) {
      console.error('Error loading map:', error);
      setMapError('An error occurred while loading the map.');
    }
  };

  // Update map when free shipping areas change
  useEffect(() => {
    if (map && freeShippingAreas) {
      updateMapHighlights();
    }
  }, [map, freeShippingAreas]);

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.mapboxgl) return;

    // Set the access token
    window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      setMapError(
        'Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.'
      );
      return;
    }

    try {
      // Create the map
      const newMap = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [123.4, 13.6], // Center on Camarines Sur
        zoom: 9
      });

      // Add navigation controls
      newMap.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

      // Wait for map to load
      newMap.on('load', () => {
        loadCamarinesSurGeoJson(newMap);
      });

      setMap(newMap);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const loadCamarinesSurGeoJson = async (mapInstance: any) => {
    try {
      // You would need to provide a GeoJSON file with Camarines Sur municipalities
      const response = await fetch('/data/camarines-sur.geojson');
      const geojsonData = await response.json();

      // Add the source
      mapInstance.addSource('camarines-sur', {
        type: 'geojson',
        data: geojsonData
      });

      // Add a fill layer
      mapInstance.addLayer({
        id: 'municipalities-fill',
        type: 'fill',
        source: 'camarines-sur',
        paint: {
          'fill-color': [
            'case',
            ['in', ['get', 'NAME'], ['literal', freeShippingAreas]],
            '#34D399', // Green for free shipping areas
            '#94A3B8' // Gray for other areas
          ],
          'fill-opacity': 0.6
        }
      });

      // Add a line layer for boundaries
      mapInstance.addLayer({
        id: 'municipalities-line',
        type: 'line',
        source: 'camarines-sur',
        paint: {
          'line-color': '#475569',
          'line-width': 1
        }
      });

      // Add click event
      mapInstance.on('click', 'municipalities-fill', (e: any) => {
        const properties = e.features[0].properties;
        const municipalityName = properties.NAME;

        // Toggle municipality in free shipping list
        if (freeShippingAreas.includes(municipalityName)) {
          setFreeShippingAreas(prev =>
            prev.filter(name => name !== municipalityName)
          );
          toast.info(`${municipalityName} removed from free shipping areas`);
        } else {
          setFreeShippingAreas(prev => [...prev, municipalityName]);
          toast.success(`${municipalityName} added to free shipping areas`);
        }
      });

      // Change cursor on hover
      mapInstance.on('mouseenter', 'municipalities-fill', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'municipalities-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
      });

      // Add hover info
      mapInstance.on('mousemove', 'municipalities-fill', (e: any) => {
        if (e.features.length > 0) {
          const properties = e.features[0].properties;
          setHoveredMunicipality(properties.NAME);
        }
      });

      mapInstance.on('mouseleave', 'municipalities-fill', () => {
        setHoveredMunicipality(null);
      });
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
    }
  };

  const updateMapHighlights = () => {
    if (!map || !map.getSource('camarines-sur')) return;

    map.setPaintProperty('municipalities-fill', 'fill-color', [
      'case',
      ['in', ['get', 'NAME'], ['literal', freeShippingAreas]],
      '#34D399', // Green for free shipping areas
      '#94A3B8' // Gray for other areas
    ]);
  };

  const handleAddMunicipality = () => {
    if (
      newMunicipality.trim() &&
      !freeShippingAreas.includes(newMunicipality.trim())
    ) {
      setFreeShippingAreas([...freeShippingAreas, newMunicipality.trim()]);
      setNewMunicipality('');
    }
  };

  const handleRemoveMunicipality = (municipality: string) => {
    setFreeShippingAreas(freeShippingAreas.filter(m => m !== municipality));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await shippingService.updateShippingSettings({
        freeShippingAreas,
        standardShippingFee
      });

      toast.success('Shipping settings saved successfully');
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      toast.error('Failed to save shipping settings');
    } finally {
      setIsSaving(false);
    }
  };

  const setupDatabase = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/setup/db', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Setup failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Database setup completed successfully');
        // Reload settings after setup
        const settings = await shippingService.getShippingSettings();
        setFreeShippingAreas(settings.freeShippingAreas);
        setStandardShippingFee(settings.standardShippingFee);
      } else {
        toast.error('Database setup failed');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      toast.error('An error occurred during database setup');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mapLoadTimeout = setTimeout(() => {
      if (!map && !window.mapboxgl) {
        setMapError(
          'Mapbox failed to load. Make sure your Mapbox token is correct.'
        );
      }
    }, 5000);

    return () => clearTimeout(mapLoadTimeout);
  }, [map]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Shipping Settings</CardTitle>
          </div>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={setupDatabase}
            disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting Up...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Setup/Reset Database
              </>
            )}
          </Button> */}
        </div>
        <CardDescription>
          Configure shipping zones and rates for your store
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Map visualization */}
            {/* <div>
              <h3 className="text-lg font-medium mb-2">Shipping Zones Map</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Green areas qualify for free shipping. Click on municipalities
                to add or remove them.
              </p>
              <div
                ref={mapContainerRef}
                className="w-full h-96 rounded-md border border-input overflow-hidden"
              />
            </div> */}

            <Separator />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Free Shipping Areas</h3>
                  <p className="text-sm text-muted-foreground">
                    Municipalities in Camarines Sur that qualify for free
                    shipping
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newMunicipality}
                    onChange={e => setNewMunicipality(e.target.value)}
                    placeholder="Add municipality"
                    className="w-48"
                  />
                  <Button
                    onClick={handleAddMunicipality}
                    size="sm"
                    variant="outline"
                    disabled={!newMunicipality.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {freeShippingAreas.map(municipality => (
                  <div
                    key={municipality}
                    className="flex items-center justify-between bg-muted p-2 px-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {municipality}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMunicipality(municipality)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Standard Shipping Fee</h3>
                <p className="text-sm text-muted-foreground">
                  Default shipping fee for areas not eligible for free shipping
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg">₱</span>
                <Input
                  type="number"
                  value={standardShippingFee}
                  onChange={e => setStandardShippingFee(Number(e.target.value))}
                  className="w-32"
                  min={0}
                />
              </div>
            </div>

            {mapError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Map Error</AlertTitle>
                <AlertDescription>{mapError}</AlertDescription>
              </Alert>
            )}

            {hoveredMunicipality && (
              <div className="absolute top-4 right-4 z-10 bg-white/90 rounded-md shadow-sm px-3 py-2">
                <p className="text-sm font-medium">{hoveredMunicipality}</p>
                <p className="text-xs text-muted-foreground">
                  {freeShippingAreas.includes(hoveredMunicipality)
                    ? 'Free Shipping Area'
                    : 'Standard Shipping (₱' + standardShippingFee + ')'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving || isLoading}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Shipping Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const [creatingTable, setCreatingTable] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Initialize form with default values from config
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      baseRate: SHIPPING_CONFIG.baseRate,
      ratePerKm: SHIPPING_CONFIG.ratePerKm,
      maxServiceDistance: SHIPPING_CONFIG.maxServiceDistance,
      serviceAreaCenterLat: SHIPPING_CONFIG.serviceAreaCenter.lat,
      serviceAreaCenterLng: SHIPPING_CONFIG.serviceAreaCenter.lng
    }
  });

  // Create settings table function
  const createSettingsTable = async () => {
    try {
      setCreatingTable(true);

      // Execute SQL to create the table
      const { error } = await supabase.rpc('create_settings_table');

      if (error) {
        console.error('Error creating settings table:', error);
        toast.error('Failed to create settings table');
        return;
      }

      toast.success('Settings table created successfully');
      setTableExists(true);

      // Save the initial config
      await saveSettings(form.getValues());
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create settings table');
    } finally {
      setCreatingTable(false);
    }
  };

  // Load current settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'shipping_map_config')
          .single();

        if (error) {
          console.log('Error loading settings:', error);
          // Define default settings
          return {
            serviceAreaCenterLat: 13.6234, // Naga City coordinates
            serviceAreaCenterLng: 123.1945,
            maxServiceDistance: 50,
            baseRate: 50,
            ratePerKm: 5
          };
        }

        // Extract settings or use defaults for missing values
        const settings = data?.value || {};
        const serviceAreaCenter = settings.serviceAreaCenter || {
          lat: 13.6234,
          lng: 123.1945
        };

        return {
          serviceAreaCenterLat: serviceAreaCenter.lat,
          serviceAreaCenterLng: serviceAreaCenter.lng,
          maxServiceDistance: settings.maxServiceDistance || 50,
          baseRate: settings.baseRate || 50,
          ratePerKm: settings.ratePerKm || 5
        };
      } catch (error) {
        console.error('Error parsing settings:', error);
        // Return defaults on error
        return {
          serviceAreaCenterLat: 13.6234,
          serviceAreaCenterLng: 123.1945,
          maxServiceDistance: 50,
          baseRate: 50,
          ratePerKm: 5
        };
      }
    };

    loadSettings().then(values => {
      form.reset(values);
    });
  }, [form, supabase]);

  // Initialize map
  useEffect(() => {
    // Wait for the container to be ready and the window to be available
    if (
      !mapContainerRef.current ||
      typeof window === 'undefined' ||
      mapLoaded
    ) {
      return;
    }

    // Load the Mapbox script dynamically
    const loadMapbox = async () => {
      try {
        // Skip if mapboxgl is already loaded
        if (window.mapboxgl) {
          initializeMap();
          return;
        }

        // Load mapbox script dynamically
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.async = true;
        script.onload = () => initializeMap();
        document.head.appendChild(script);

        // Load the CSS
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      } catch (error) {
        console.error('Error loading Mapbox:', error);
      }
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || !window.mapboxgl) return;

      // Set the access token
      window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      try {
        // Create the map with explicit projection and a different style
        const newMap = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11', // Use light-v11 style instead
          center: [
            form.getValues('serviceAreaCenterLng'),
            form.getValues('serviceAreaCenterLat')
          ],
          zoom: 9,
          projection: 'mercator' // Explicitly set the projection to mercator
        });

        // Add navigation controls
        newMap.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

        // Wait for map to load
        newMap.on('load', () => {
          // Add a marker for the center point
          new window.mapboxgl.Marker()
            .setLngLat([
              form.getValues('serviceAreaCenterLng'),
              form.getValues('serviceAreaCenterLat')
            ])
            .addTo(newMap);

          // Add service area circle
          newMap.addSource('service-area', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [
                  form.getValues('serviceAreaCenterLng'),
                  form.getValues('serviceAreaCenterLat')
                ]
              }
            }
          });

          // Add a circle layer
          newMap.addLayer({
            id: 'service-area-fill',
            type: 'circle',
            source: 'service-area',
            paint: {
              'circle-radius': {
                stops: [
                  [0, 0],
                  [20, form.getValues('maxServiceDistance') * 1000 * 50]
                ],
                base: 2
              },
              'circle-color': '#4096ff',
              'circle-opacity': 0.2,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#1677ff'
            }
          });

          setMapLoaded(true);
          setMap(newMap);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    loadMapbox();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [form, mapLoaded, map]);

  // Update map when service area config changes
  useEffect(() => {
    if (map && map.isStyleLoaded && map.isStyleLoaded()) {
      try {
        // Update marker position
        const markers = document.getElementsByClassName('mapboxgl-marker');
        if (markers.length > 0) {
          const marker = new window.mapboxgl.Marker(markers[0] as HTMLElement)
            .setLngLat([
              form.getValues('serviceAreaCenterLng'),
              form.getValues('serviceAreaCenterLat')
            ])
            .addTo(map);
        }

        // Update service area radius
        if (map.getSource('service-area')) {
          map.getSource('service-area').setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [
                form.getValues('serviceAreaCenterLng'),
                form.getValues('serviceAreaCenterLat')
              ]
            }
          });

          // Update circle radius
          map.setPaintProperty('service-area-fill', 'circle-radius', {
            stops: [
              [0, 0],
              [20, form.getValues('maxServiceDistance') * 1000 * 50]
            ],
            base: 2
          });
        }
      } catch (error) {
        console.error('Error updating map:', error);
      }
    }
  }, [form, map]);

  // Save settings function
  const saveSettings = async (values: ShippingFormValues) => {
    if (!tableExists) {
      toast.error('Settings table does not exist. Please create it first.');
      return;
    }

    try {
      setIsLoading(true);

      const configToSave = {
        baseRate: values.baseRate,
        ratePerKm: values.ratePerKm,
        maxServiceDistance: values.maxServiceDistance,
        serviceAreaCenter: {
          lat: values.serviceAreaCenterLat,
          lng: values.serviceAreaCenterLng
        }
      };

      const { error } = await supabase.from('settings').upsert(
        {
          key: 'shipping_config',
          value: configToSave
        },
        { onConflict: 'key' }
      );

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save settings');
        return;
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit handler
  const onSubmit = (values: ShippingFormValues) => {
    saveSettings(values);
  };

  return (
    <div className="space-y-8">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      {/* <div className="grid gap-6 md:grid-cols-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Configuration</CardTitle>
                <CardDescription>
                  Configure your shipping rates and service area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Delivery Fees</h3>
                  <FormField
                    control={form.control}
                    name="baseRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Delivery Fee (₱)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>
                          Minimum fee charged for all deliveries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ratePerKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate Per Kilometer (₱)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormDescription>
                          Additional fee per kilometer traveled
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxServiceDistance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Service Distance (km)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormDescription>
                          Maximum distance for delivery service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium">Service Area Center</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set the center point of your delivery service area
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="serviceAreaCenterLat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.0001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceAreaCenterLng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.0001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading || !tableExists}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Area Preview</CardTitle>
              <CardDescription>
                Visual representation of your delivery area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={mapContainerRef}
                className="w-full h-[400px] rounded-md overflow-hidden border"
              />
              <p className="mt-4 text-sm text-muted-foreground">
                The blue circle represents your maximum service area based on
                current settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Fee Calculator</CardTitle>
              <CardDescription>
                Preview delivery fees based on distance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>5 km distance:</span>
                  <span className="font-medium">
                    ₱
                    {(
                      form.getValues('baseRate') +
                      5 * form.getValues('ratePerKm')
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>10 km distance:</span>
                  <span className="font-medium">
                    ₱
                    {(
                      form.getValues('baseRate') +
                      10 * form.getValues('ratePerKm')
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>15 km distance:</span>
                  <span className="font-medium">
                    ₱
                    {(
                      form.getValues('baseRate') +
                      15 * form.getValues('ratePerKm')
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>20 km distance:</span>
                  <span className="font-medium">
                    ₱
                    {(
                      form.getValues('baseRate') +
                      20 * form.getValues('ratePerKm')
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Max distance ({form.getValues('maxServiceDistance')} km):
                  </span>
                  <span className="font-medium">
                    ₱
                    {(
                      form.getValues('baseRate') +
                      form.getValues('maxServiceDistance') *
                        form.getValues('ratePerKm')
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div> */}

      {!tableExists && (
        <Alert className="mt-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Settings Table Missing</AlertTitle>
          <AlertDescription>
            The settings table does not exist in your database. You need to
            create it before you can save settings.
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={createSettingsTable}
                disabled={creatingTable}>
                {creatingTable ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Table...
                  </>
                ) : (
                  'Create Settings Table'
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <ShippingSettings />
    </div>
  );
}
