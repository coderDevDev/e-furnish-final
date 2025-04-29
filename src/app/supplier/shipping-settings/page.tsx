'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Plus, X, Save, Truck } from 'lucide-react';
import { toast } from 'sonner';

// Constants
const FIRST_DISTRICT_MUNICIPALITIES = [
  'Naga City',
  'Bombon',
  'Calabanga',
  'Camaligan',
  'Canaman',
  'Gainza',
  'Magarao',
  'Milaor',
  'Minalabac',
  'Pamplona',
  'Pasacao',
  'San Fernando'
];

type ShippingSettings = {
  freeShippingAreas: string[];
  standardShippingFee: number;
};

export default function ShippingSettingsPage() {
  const [freeShippingAreas, setFreeShippingAreas] = useState<string[]>(
    FIRST_DISTRICT_MUNICIPALITIES
  );
  const [standardShippingFee, setStandardShippingFee] = useState<number>(500);
  const [newMunicipality, setNewMunicipality] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApprovedSupplier, setIsApprovedSupplier] = useState<boolean>(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkSupplierStatus();
  }, []);

  const checkSupplierStatus = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login?redirect=/supplier/shipping-settings';
        return;
      }

      const { data, error } = await supabase
        .from('suppliers')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (error || !data || data.status !== 'approved') {
        redirect('/supplier/application-status');
      } else {
        setIsApprovedSupplier(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load shipping settings from database on component mount
  useEffect(() => {
    loadShippingSettings();
  }, []);

  const loadShippingSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shipping_settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Table doesn't exist or no data
          await createInitialSettings();
        } else {
          throw error;
        }
      } else if (data) {
        setFreeShippingAreas(data.free_shipping_areas);
        setStandardShippingFee(data.standard_shipping_fee);
      }
    } catch (error) {
      console.error('Error loading shipping settings:', error);
      toast.error('Failed to load shipping settings');
    } finally {
      setIsLoading(false);
    }
  };

  const createInitialSettings = async () => {
    try {
      const { error } = await supabase.from('shipping_settings').insert({
        free_shipping_areas: FIRST_DISTRICT_MUNICIPALITIES,
        standard_shipping_fee: 500
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating initial settings:', error);
      toast.error('Failed to create initial settings');
    }
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
      const { error } = await supabase.from('shipping_settings').upsert({
        id: 1, // Use a constant ID for the single settings record
        free_shipping_areas: freeShippingAreas,
        standard_shipping_fee: standardShippingFee,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Shipping settings saved successfully');
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      toast.error('Failed to save shipping settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        Shipping Settings
      </h1>

      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle>Shipping Settings</CardTitle>
            </div>
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
                    Default shipping fee for areas not eligible for free
                    shipping
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">₱</span>
                  <Input
                    type="number"
                    value={standardShippingFee}
                    onChange={e =>
                      setStandardShippingFee(Number(e.target.value))
                    }
                    className="w-32"
                    min={0}
                  />
                </div>
              </div>
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
    </div>
  );
}
