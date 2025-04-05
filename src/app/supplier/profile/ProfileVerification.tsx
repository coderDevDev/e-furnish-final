'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FileText, Upload } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const supabase = createClientComponentClient();

// List of wood-related license types
const LICENSE_TYPES = [
  { id: 'forestry_permit', name: 'Forestry Permit' },
  { id: 'timber_permit', name: 'Timber Harvest/Transport Permit' },
  { id: 'lumber_dealer', name: 'Lumber Dealer Permit' },
  { id: 'woodworking', name: 'Woodworking Business License' },
  { id: 'furniture_manufacturing', name: 'Furniture Manufacturing License' },
  { id: 'wood_export', name: 'Wood Export/Import Permit' },
  { id: 'environmental', name: 'Environmental Compliance Certificate' },
  { id: 'processing', name: 'Wood Processing Permit' },
  { id: 'certification', name: 'Sustainable Forestry Certification' },
  { id: 'other', name: 'Other Wood-Related Permit' }
];

export default function ProfileVerification() {
  const [license, setLicense] = useState<File | null>(null);
  const [licenseType, setLicenseType] = useState<string>('');
  const [status, setStatus] = useState<'Pending' | 'Verified' | 'Rejected'>(
    'Pending'
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    fetchLicenseData();
  }, []);

  const fetchLicenseData = async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error retrieving session:', sessionError);
        return;
      }

      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (error) {
        console.error('Error fetching license data:', error);
        return;
      }

      if (data) {
        setUploadedFile({
          name: data.file_url.split('/').pop() || '',
          url: data.file_url,
          type: data.license_type || 'Not specified'
        });
        setStatus(data.status);
        if (data.license_type) {
          setLicenseType(data.license_type);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch license data');
    }
  };

  const handleUpload = async () => {
    if (!license) {
      toast.error('Please select a license document to upload');
      return;
    }

    if (!licenseType) {
      toast.error('Please select a license type');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('No authenticated session found');
        return;
      }

      // Check if the user already has a license record
      const { data: existingLicense } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // Prepare the file path
      const filePath = `licenses/${session.user.id}/${license.name}`;

      // If file exists in storage, remove it first
      if (existingLicense) {
        const existingFilePath = existingLicense.file_url.split('/').pop();
        if (existingFilePath) {
          await supabase.storage
            .from('licenses')
            .remove([`licenses/${session.user.id}/${existingFilePath}`]);
        }
      }

      // Upload the new file
      const { data, error } = await supabase.storage
        .from('licenses')
        .upload(filePath, license, { upsert: true });

      if (error) throw error;

      // Get the public URL of the uploaded file
      const {
        data: { publicUrl }
      } = supabase.storage.from('licenses').getPublicUrl(data.path);

      // If record exists, update it; otherwise insert new record
      let dbError;
      if (existingLicense) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('licenses')
          .update({
            file_url: publicUrl,
            license_type: licenseType,
            status: 'Pending', // Reset to pending since it's a new upload
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user.id);

        dbError = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from('licenses').insert([
          {
            user_id: session.user.id,
            file_url: publicUrl,
            license_type: licenseType,
            status: 'Pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

        dbError = insertError;
      }

      if (dbError) throw dbError;

      setUploadedFile({
        name: license.name,
        url: publicUrl,
        type: licenseType
      });
      setStatus('Pending');

      const actionType = existingLicense ? 'updated' : 'uploaded';
      toast.success(
        `License ${actionType} successfully. Awaiting verification.`
      );

      // Refresh data from the server
      fetchLicenseData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload license');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicense(file);
    }
  };

  const getLicenseTypeName = (id: string) => {
    const licenseType = LICENSE_TYPES.find(type => type.id === id);
    return licenseType ? licenseType.name : id;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>License Verification</CardTitle>
        <CardDescription>
          Upload your wood-related business license or permit for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadedFile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">
                Current Document: {uploadedFile.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">License Type:</span>
              <span className="text-sm">
                {getLicenseTypeName(uploadedFile.type)}
              </span>
            </div>
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm">
              View Document
            </a>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium">Status:</span>
              <span
                className={`text-sm font-medium ${
                  status === 'Verified'
                    ? 'text-green-500'
                    : status === 'Rejected'
                    ? 'text-red-500'
                    : 'text-yellow-500'
                }`}>
                {status}
              </span>
            </div>
            {status === 'Pending' && (
              <p className="text-sm text-gray-500 mt-2">
                Your license is under review. You will be notified once
                verified.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-type">License/Permit Type</Label>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger id="license-type">
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="license-file">License Document</Label>
              <Input
                id="license-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">
                Supported formats: PDF, PNG, JPG (max 5MB)
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={loading || !license || !licenseType}
              className="w-full">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload License</span>
                </div>
              )}
            </Button>
            {loading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
