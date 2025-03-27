'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Briefcase
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SupplierProfile {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  description?: string;
  business_type: string;
  registration_number: string;
  tax_id: string;
  status: 'Active' | 'Pending' | 'Suspended';
  created_at: string;
  updated_at: string;
}

const supabase = createClientComponentClient();

export default function SupplierDetails() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierProfile();
  }, []);

  const fetchSupplierProfile = async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error retrieving session:', sessionError);
        return;
      }

      if (!session) {
        toast.error('No authenticated session found');
        return;
      }

      // Try to fetch existing profile
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create a new one
          const { data: newProfile, error: createError } = await supabase
            .from('suppliers')
            .insert([
              {
                user_id: session.user.id,
                name: '',
                email: session.user.email,
                status: 'Pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
          setIsEditing(true); // Automatically enable editing for new profiles
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching supplier profile:', error);
      toast.error('Failed to load supplier profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('No authenticated session found');
        return;
      }

      const { error } = await supabase
        .from('suppliers')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating supplier profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Company Name</span>
                </label>
                <Input
                  value={profile?.name || ''}
                  onChange={e =>
                    setProfile(prev => ({ ...prev!, name: e.target.value }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Business Type</span>
                </label>
                <Input
                  value={profile?.business_type || ''}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev!,
                      business_type: e.target.value
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Contact Number</span>
                </label>
                <Input
                  value={profile?.phone || ''}
                  onChange={e =>
                    setProfile(prev => ({ ...prev!, phone: e.target.value }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </label>
                <Input
                  value={profile?.email || ''}
                  onChange={e =>
                    setProfile(prev => ({ ...prev!, email: e.target.value }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Registration Number</span>
                </label>
                <Input
                  value={profile?.registration_number || ''}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev!,
                      registration_number: e.target.value
                    }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Tax ID</span>
                </label>
                <Input
                  value={profile?.tax_id || ''}
                  onChange={e =>
                    setProfile(prev => ({ ...prev!, tax_id: e.target.value }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </label>
                <Textarea
                  value={profile?.address || ''}
                  onChange={e =>
                    setProfile(prev => ({ ...prev!, address: e.target.value }))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Website (Optional)</span>
                </label>
                <Input
                  value={profile?.website || ''}
                  onChange={e =>
                    setProfile(prev => ({ ...prev!, website: e.target.value }))
                  }
                  disabled={!isEditing}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Company Description (Optional)</span>
                </label>
                <Textarea
                  value={profile?.description || ''}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev!,
                      description: e.target.value
                    }))
                  }
                  disabled={!isEditing}
                  placeholder="Brief description of your company..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
