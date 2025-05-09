'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { toast } from 'sonner';
import { useAppDispatch } from '@/lib/hooks/redux';
import {
  setDeliveryAddress,
  setShippingFee
} from '@/lib/features/checkout/checkoutSlice';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import {
  locationService,
  type Region,
  type Province,
  type City,
  type Barangay
} from '@/lib/services/locationService';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  phone: z.string().min(10, {
    message: 'Phone number must be at least 10 digits.'
  }),
  street: z.string().min(5, {
    message: 'Street address must be at least 5 characters.'
  }),
  region: z.string().min(1, {
    message: 'Please select a region.'
  }),
  province: z.string().min(1, {
    message: 'Please select a province.'
  }),
  city: z.string().min(1, {
    message: 'Please select a city.'
  }),
  barangay: z.string().min(1, {
    message: 'Please select a barangay.'
  }),
  zipCode: z
    .string()
    .min(4, 'ZIP code must be exactly 4 digits')
    .max(4, 'ZIP code must be exactly 4 digits')
    .regex(/^[0-9]{4}$/, 'ZIP code must contain only 4 digits')
});

type ShippingFormValues = z.infer<typeof formSchema>;

type ShippingSettings = {
  freeShippingAreas: string[];
  standardShippingFee: number;
};

export function ShippingForm({ onNext }: { onNext: () => void }) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettings | null>(null);
  const supabase = createClientComponentClient();

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      street: '',
      region: '',
      province: '',
      city: '',
      barangay: '',
      zipCode: ''
    }
  });

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regions = await locationService.getRegions();
        setRegions(regions);
      } catch (error) {
        console.error('Error loading regions:', error);
        toast.error('Failed to load regions');
      }
    };
    loadRegions();
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    const loadProvinces = async () => {
      const regionCode = form.watch('region');
      if (!regionCode) return;

      try {
        const provinces = await locationService.getProvinces(regionCode);
        setProvinces(provinces);
      } catch (error) {
        console.error('Error loading provinces:', error);
        toast.error('Failed to load provinces');
      }
    };
    loadProvinces();
  }, [form.watch('region')]);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      const provinceCode = form.watch('province');
      if (!provinceCode) return;

      try {
        const cities = await locationService.getCities(provinceCode);
        setCities(cities);
      } catch (error) {
        console.error('Error loading cities:', error);
        toast.error('Failed to load cities');
      }
    };
    loadCities();
  }, [form.watch('province')]);

  // Load barangays when city changes
  useEffect(() => {
    const loadBarangays = async () => {
      const cityCode = form.watch('city');
      if (!cityCode) return;

      try {
        const barangays = await locationService.getBarangays(cityCode);
        setBarangays(barangays);
      } catch (error) {
        console.error('Error loading barangays:', error);
        toast.error('Failed to load barangays');
      }
    };
    loadBarangays();
  }, [form.watch('city')]);

  // Load user profile and set form values
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const userProfile = await authService.getUserProfile();

        if (userProfile) {
          const { user, profile } = userProfile;
          const address = profile?.address as {
            street: string;
            region_id: string;
            region_name: string;
            province_id: string;
            province_name: string;
            city_id: string;
            city_name: string;
            barangay_id: string;
            barangay_name: string;
            zip_code: string;
          };

          if (address) {
            // Construct full address string and dispatch immediately
            const fullAddress = `${address.street}, ${address.barangay_name}, ${address.city_name}, ${address.province_name}, ${address.region_name}, ${address.zip_code}`;

            dispatch(
              setDeliveryAddress({
                address: fullAddress,
                lat: 0,
                lng: 0
              })
            );
          }

          form.reset({
            fullName: profile?.full_name || '',
            email: user.email || '',
            phone: profile?.phone || '',
            street: address?.street || '',
            region: address?.region_id || '',
            province: address?.province_id || '',
            city: address?.city_id || '',
            barangay: address?.barangay_id || '',
            zipCode: address?.zip_code || ''
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [dispatch, form]);

  // Load shipping settings on mount
  useEffect(() => {
    loadShippingSettings();
  }, []);

  const loadShippingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'shipping_config')
        .single();

      if (error) throw error;

      const settings: ShippingSettings = data.value;
      setShippingSettings(settings);
    } catch (error) {
      console.error('Error loading shipping settings:', error);
    }
  };

  async function onSubmit(values: ShippingFormValues) {
    try {
      const region = regions.find(r => r.id === values.region);
      const province = provinces.find(p => p.id === values.province);
      const city = cities.find(c => c.id === values.city);
      const barangay = barangays.find(b => b.id === values.barangay);

      // Construct full address string
      const fullAddress = `${values.street}, ${barangay?.name}, ${city?.name}, ${province?.name}, ${region?.name}, ${values.zipCode}`;

      // Update profile in Supabase
      await authService.updateUserProfile({
        full_name: values.fullName,
        phone: values.phone,
        address: {
          street: values.street,
          region_id: values.region,
          region_name: region?.name || '',
          province_id: values.province,
          province_name: province?.name || '',
          city_id: values.city,
          city_name: city?.name || '',
          barangay_id: values.barangay,
          barangay_name: barangay?.name || '',
          zip_code: values.zipCode
        }
      } as any); // Using 'any' to bypass the type error temporarily

      // Dispatch address to Redux store
      dispatch(
        setDeliveryAddress({
          address: fullAddress,
          lat: 0,
          lng: 0
        })
      );

      toast.success('Shipping information updated');
      onNext();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update shipping information');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+63 XXX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map(region => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Province</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!form.watch('region')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provinces.map(province => (
                        <SelectItem key={province.id} value={province.id}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City/Municipality</FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value);
                      // Get the selected city object
                      const selectedCity = cities.find(c => c.id === value);
                      if (selectedCity && shippingSettings) {
                        // Check if city is in free shipping areas
                        const isFreeShipping =
                          shippingSettings.freeShippingAreas.some(
                            area =>
                              area.toLowerCase() ===
                              selectedCity.name.toLowerCase()
                          );

                        // Set shipping fee in Redux store
                        const fee = isFreeShipping
                          ? 0
                          : shippingSettings.standardShippingFee;
                        dispatch(setShippingFee(fee));
                      }
                    }}
                    defaultValue={field.value}
                    disabled={!form.watch('province')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {(() => {
                      const selectedCity = cities.find(
                        c => c.id === field.value
                      );
                      if (
                        selectedCity &&
                        shippingSettings?.freeShippingAreas.includes(
                          selectedCity.name
                        )
                      ) {
                        return (
                          <span className="text-green-600">
                            Free shipping available!
                          </span>
                        );
                      }
                      return (
                        <span className="text-muted-foreground">
                          Standard shipping fee: ₱
                          {shippingSettings?.standardShippingFee.toLocaleString(
                            'en-PH',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }
                          )}
                        </span>
                      );
                    })()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barangay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!form.watch('city')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barangays.map(barangay => (
                        <SelectItem key={barangay.id} value={barangay.id}>
                          {barangay.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP/Postal Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="4-digit code (e.g., 1000)"
                    maxLength={4}
                    {...field}
                    onChange={e => {
                      // Only allow numeric input for ZIP code
                      const value = e.target.value.replace(/\D/g, '');
                      e.target.value = value;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 mt-1">
                  Philippine ZIP codes are 4 digits (e.g., 1000 for Manila)
                </p>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-primary">
            Continue to Payment
          </Button>
        </form>
      </Form>
    </div>
  );
}
