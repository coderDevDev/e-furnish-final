'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Loader2, Upload, X, FileText, Check } from 'lucide-react';
import Link from 'next/link';

// Form schema
const supplierSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  contact_person: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Complete address is required'),
  business_type: z.string().min(1, 'Business type is required'),
  tax_id: z.string().optional(),
  description: z.string().optional()
});

type FormValues = z.infer<typeof supplierSchema>;

export default function SupplierRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Check if user already has an application
  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      setIsCheckingApplication(true);

      // Check if user is logged in
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to login
        router.push('/login?redirect=/supplier/register');
        return;
      }

      // Check if already has an application
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setExistingApplication(data);
        // If application is pending or approved, redirect to status page
        if (data.status === 'pending' || data.status === 'approved') {
          router.push('/supplier/application-status');
        }
      }
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setIsCheckingApplication(false);
    }
  };

  const ensureStorageBucketExists = async () => {
    try {
      // Instead of creating the bucket, just check if it exists
      const { data: buckets, error } = await supabase.storage.listBuckets();

      if (error) {
        console.error('Error checking storage buckets:', error);
        return false;
      }

      console.log({ buckets });
      const bucketExists = buckets.some(bucket => bucket.name === 'documents');

      if (!bucketExists) {
        console.error('Documents bucket does not exist - please contact admin');
        toast.error(
          'Document storage is not properly configured. Please contact support.'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking storage bucket exists:', error);
      return false;
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      business_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      business_type: '',
      tax_id: '',
      description: ''
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setDocuments([...documents, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  // Create a separate upload function similar to the working example
  const uploadDocument = async (
    file: File,
    userId: string
  ): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `supplier-docs/${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('documents') // Use the bucket that already exists and works
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      if (!data?.path) {
        throw new Error('Upload failed - no path returned');
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('documents').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to apply as a supplier');
        return;
      }

      // Create or update supplier record
      const supplierData = {
        user_id: user.id,
        business_name: data.business_name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        business_type: data.business_type,
        tax_id: data.tax_id,
        description: data.description,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Upload documents if provided
      if (documents.length > 0) {
        setIsUploading(true);

        try {
          const documentUrls = [];

          for (let i = 0; i < documents.length; i++) {
            setUploadProgress(Math.round((i / documents.length) * 50));
            const url = await uploadDocument(documents[i], user.id);
            documentUrls.push(url);
          }

          // Add document URLs to supplier data
          supplierData.document_urls = documentUrls;
        } catch (error: any) {
          console.error('Error uploading documents:', error);
          throw new Error(`Failed to upload documents: ${error.message}`);
        } finally {
          setIsUploading(false);
          setUploadProgress(100);
        }
      }

      // If existing rejected application, update it
      if (existingApplication && existingApplication.status === 'rejected') {
        const { error: updateError } = await supabase
          .from('suppliers')
          .update({
            ...supplierData,
            status: 'pending',
            rejected_at: null,
            notes: null
          })
          .eq('id', existingApplication.id);

        if (updateError) {
          throw new Error(`Error updating application: ${updateError.message}`);
        }
      } else {
        // Create new application
        const { error: insertError } = await supabase
          .from('suppliers')
          .insert([supplierData]);

        if (insertError) {
          throw new Error(
            `Error submitting application: ${insertError.message}`
          );
        }
      }

      toast.success('Your supplier application has been submitted!');

      // Redirect to application status page
      router.push('/supplier/application-status');
    } catch (error: any) {
      console.error('Error during registration:', error);
      toast.error(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingApplication) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Registration</CardTitle>
          <CardDescription>
            Register as a supplier to sell your products on our platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Business phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full business address"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="business_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manufacturer">
                            Manufacturer
                          </SelectItem>
                          <SelectItem value="distributor">
                            Distributor
                          </SelectItem>
                          <SelectItem value="wholesaler">Wholesaler</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="importer">Importer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID/Business Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Tax ID or business registration number"
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your business, products, and services"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about your business, the materials you
                      offer, and your specialties.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Supporting Documents</FormLabel>
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <input
                    type="file"
                    multiple
                    id="document-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="document-upload"
                    className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium">
                      Click to upload documents
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Business registration, licenses, certificates, etc.
                    </span>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <FormLabel>Uploaded Documents</FormLabel>
                    <ul className="space-y-2">
                      {documents.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between px-3 py-2 border rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm truncate max-w-xs">
                              {file.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}>
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[150px]">
                  {isSubmitting ? (
                    <>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading documents ({uploadProgress}%)
                        </>
                      ) : (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      )}
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-gray-500">
            <p>
              By submitting this form, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="w-full flex justify-start">
            <Button variant="outline" asChild>
              <Link href="/supplier">Cancel</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold">Becoming a Supplier - FAQs</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">
              What happens after I submit my application?
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Our team will review your application and documents within 2-3
              business days. You'll be notified via email once a decision has
              been made.
            </p>
          </div>

          <div>
            <h3 className="font-medium">What documents should I submit?</h3>
            <p className="text-gray-600 text-sm mt-1">
              Include your business registration, relevant licenses, product
              catalogs, and any certifications that may be applicable to your
              business.
            </p>
          </div>

          <div>
            <h3 className="font-medium">Can I sell right away?</h3>
            <p className="text-gray-600 text-sm mt-1">
              No, you'll need to wait for your application to be approved before
              you can start posting offers and receiving orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
