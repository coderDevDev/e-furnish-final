'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package2,
  CreditCard,
  Loader2
} from 'lucide-react';
import OrderHistory from './components/OrderHistory';
import AddressBook from './components/AddressBook';
import PaymentMethods from './components/PaymentMethods';
import PermitsTab from './components/PermitsTab';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  street: z.string().min(1, 'Street address is required'),
  barangay_name: z.string().min(1, 'Barangay is required'),
  city_name: z.string().min(1, 'City is required'),
  province_name: z.string().min(1, 'Province is required'),
  region_name: z.string().min(1, 'Region is required'),
  zip_code: z.string().min(1, 'ZIP code is required')
});

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [supplierStatus, setSupplierStatus] = useState<string | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_number: '',
      street: '',
      barangay_name: '',
      city_name: '',
      province_name: '',
      region_name: '',
      zip_code: ''
    }
  });

  useEffect(() => {
    loadProfile();
    checkSupplierStatus();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (profile) {
        console.log('Profile loaded:', profile);
        setUserRole(profile.role);

        // Extract address fields from the address object
        const address = profile.address || {};

        form.reset({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone_number: profile.phone?.replace('(+63) ', '') || '',
          street: address.street || '',
          barangay_name: address.barangay_name || '',
          city_name: address.city_name || '',
          province_name: address.province_name || '',
          region_name: address.region_name || '',
          zip_code: address.zip_code || ''
        });
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkSupplierStatus = async () => {
    try {
      setIsCheckingApplication(true);
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('status')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error checking supplier status:', error);
      } else {
        setSupplierStatus(supplier?.status || null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsCheckingApplication(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      setUpdating(true);
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Construct the address object
      const address = {
        street: values.street,
        barangay_name: values.barangay_name,
        city_name: values.city_name,
        province_name: values.province_name,
        region_name: values.region_name,
        zip_code: values.zip_code
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          email: values.email,
          phone: `(+63) ${values.phone_number}`,
          address: address,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      loadProfile(); // Reload the profile to ensure we have the latest data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <Tabs defaultValue="profile" className="space-y-6">
        <div className="flex justify-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="permits">
                Permits
                {supplierStatus === 'pending' && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
                {supplierStatus === 'approved' && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Approved
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="profile">
          <Card className="border-none shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input className="pl-9" {...field} />
                            </div>
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
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium">Address Information</h3>

                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="barangay_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barangay</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="province_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="region_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="w-full sm:w-auto min-w-[200px]">
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="permits">
            {isCheckingApplication ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <PermitsTab supplierStatus={supplierStatus} />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
