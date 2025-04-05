'use client';

import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Loader2, Save, Map as MapIcon, AlertTriangle } from 'lucide-react';
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
          .eq('key', 'shipping_config')
          .single();

        if (error) {
          // Check if error is due to missing table
          if (error.code === '42P01') {
            // PostgreSQL code for relation does not exist
            console.warn('Settings table does not exist');
            setTableExists(false);
            return;
          }

          console.error('Error loading settings:', error);
          return;
        }

        if (data && data.value) {
          let config;
          if (typeof data.value === 'string') {
            config = JSON.parse(data.value);
          } else {
            config = data.value;
          }

          form.reset({
            baseRate: config.baseRate,
            ratePerKm: config.ratePerKm,
            maxServiceDistance: config.maxServiceDistance,
            serviceAreaCenterLat: config.serviceAreaCenter.lat,
            serviceAreaCenterLng: config.serviceAreaCenter.lng
          });
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
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
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">Shipping Settings</h1>

      {!tableExists && (
        <Alert className="mb-6" variant="destructive">
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

      <div className="grid gap-6 md:grid-cols-2">
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
      </div>
    </div>
  );
}
