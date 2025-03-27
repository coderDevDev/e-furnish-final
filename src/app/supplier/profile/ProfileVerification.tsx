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

const supabase = createClientComponentClient();

export default function ProfileVerification() {
  const [license, setLicense] = useState<File | null>(null);
  const [status, setStatus] = useState<'Pending' | 'Verified' | 'Rejected'>(
    'Pending'
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
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
          url: data.file_url
        });
        setStatus(data.status);
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

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('licenses')
        .upload(`licenses/${session.user.id}/${license.name}`, license);

      if (error) throw error;

      // Get the public URL of the uploaded file
      const {
        data: { publicUrl }
      } = supabase.storage.from('licenses').getPublicUrl(data.path);

      // Save metadata to the licenses table
      const { error: dbError } = await supabase.from('licenses').insert([
        {
          user_id: session.user.id,
          file_url: publicUrl,
          status: 'Pending',
          // file_name: license.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      if (dbError) throw dbError;

      setUploadedFile({ name: license.name, url: publicUrl });
      setStatus('Pending');
      toast.success('License uploaded successfully. Awaiting verification.');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>License Verification</CardTitle>
        <CardDescription>
          Upload your business license for verification
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
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input
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
              disabled={loading || !license}
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
