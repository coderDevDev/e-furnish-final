'use client';

import { useState, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, X, ImagePlus, Info } from 'lucide-react';
import Image from 'next/image';

// Form schema
const offerSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(20, 'Please provide a detailed description'),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  discount_percentage: z.coerce.number().min(0).max(100).optional(),
  min_order_quantity: z.coerce
    .number()
    .min(1, 'Minimum order quantity is required'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'draft']),
  is_featured: z.boolean().default(false)
});

type FormValues = z.infer<typeof offerSchema>;

// Categories list
const categories = [
  'Kitchen',
  'Bedroom',
  'Living Room',
  'Dining Room',
  'Office',
  'Outdoor',
  'Bathroom',
  'Custom Furniture',
  'Accessories',
  'Raw Materials'
];

type CreateOfferFormProps = {
  offerId?: string;
  defaultValues?: Partial<FormValues>;
};

export default function CreateOfferForm({
  offerId,
  defaultValues
}: CreateOfferFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(
    defaultValues?.image_url || ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      price: 0,
      discount_percentage: 0,
      min_order_quantity: 1,
      category: '',
      status: 'draft',
      is_featured: false
    }
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          'Invalid file type. Only JPG, PNG and WebP are allowed'
        );
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Get supplier ID for folder organization
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) {
        throw new Error('Supplier profile not found');
      }

      const fileExt = file.type.split('/')[1];
      const fileName = `${supplierData.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('supplier-offers')
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
      } = supabase.storage.from('supplier-offers').getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl('');
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create an offer');
      }

      // Get supplier ID
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) {
        throw new Error('Supplier profile not found');
      }

      const offerData = {
        title: data.title,
        description: data.description,
        price: data.price,
        discount_percentage: data.discount_percentage || 0,
        min_order_quantity: data.min_order_quantity,
        category: data.category,
        status: data.status,
        is_featured: data.is_featured,
        supplier_id: supplierData.id,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      if (offerId) {
        // Update existing offer
        const { error } = await supabase
          .from('supplier_offers')
          .update(offerData)
          .eq('id', offerId);

        if (error) throw error;

        toast.success('Offer updated successfully');
      } else {
        // Create new offer
        offerData.created_at = new Date().toISOString();

        const { error } = await supabase
          .from('supplier_offers')
          .insert([offerData]);

        if (error) throw error;

        toast.success('Offer created successfully');
      }

      // Navigate back to offers list
      router.push('/supplier/offers');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving offer:', error);
      toast.error(`Failed to save offer: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Offer Details</TabsTrigger>
            <TabsTrigger value="image">Product Image</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Offer Information</CardTitle>
                <CardDescription>
                  Enter the details of your product or service offer
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Product or service name"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A clear, concise title for your offer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed description of your product or service"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description including specifications,
                        materials, and features
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₱)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Price per unit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional discount percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_order_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Order Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum units per order
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the most appropriate category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Control the visibility of your offer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured Offer</FormLabel>
                        <FormDescription>
                          Featured offers may receive more visibility
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>
                  Upload an image of your product
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />

                  {imageUrl ? (
                    <div className="relative border rounded-md overflow-hidden aspect-video">
                      <Image
                        src={imageUrl}
                        alt="Product"
                        fill
                        className="object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={removeImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={handleImageClick}
                      className="border border-dashed rounded-md p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Uploading image...
                          </p>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="font-medium">
                            Click to upload product image
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            JPG, PNG or WebP (max 5MB)
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-start space-x-2 bg-muted/50 p-3 rounded-md">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      High-quality images increase customer interest. Use a
                      well-lit photo that clearly shows your product from the
                      best angle.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/supplier/offers')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {offerId ? 'Update Offer' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
