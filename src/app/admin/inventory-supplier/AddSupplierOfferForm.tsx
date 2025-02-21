'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Supplier } from '@/types/inventory.types';
import { supplierOfferService } from '@/lib/services/supplierOfferService';
import {
  X,
  Loader2,
  Building2,
  Package,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  Truck,
  CreditCard,
  Info,
  AlertCircle,
  Upload,
  Plus,
  Trash2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const formSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  material_name: z.string().min(1, 'Material name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  price_per_unit: z.coerce
    .number()
    .min(0, 'Price must be greater than or equal to 0'),
  currency: z.string().min(1, 'Currency is required'),
  description: z.string().min(1, 'Description is required'),
  availability_date: z.string().min(1, 'Availability date is required'),
  lead_time_days: z.coerce.number().min(0, 'Lead time is required'),
  minimum_order_qty: z.coerce
    .number()
    .min(0, 'Minimum order quantity is required'),
  maximum_order_qty: z.coerce
    .number()
    .min(0, 'Maximum order quantity is required'),
  payment_terms: z.string().min(1, 'Payment terms are required'),
  delivery_terms: z.string().min(1, 'Delivery terms are required'),
  supplier_notes: z.string().min(1, 'Supplier notes are required'),
  supplier_contact: z.string().min(1, 'Contact person is required'),
  supplier_email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Contact email is required')
});

interface AddSupplierOfferFormProps {
  suppliers: Supplier[];
  onClose?: () => void;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

export default function AddSupplierOfferForm({
  suppliers,
  onClose
}: AddSupplierOfferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<ImagePreview | null>(
    null
  );
  const [galleryPreviews, setGalleryPreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const supabase = createClientComponentClient();

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    isGallery = false
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (isGallery) {
      const newPreviews = Array.from(files).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    } else {
      const file = files[0];
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview.previewUrl);
      }
      setMainImagePreview({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
  };

  const removePreview = (previewUrl: string, isMainImage = false) => {
    if (isMainImage) {
      if (mainImagePreview) {
        URL.revokeObjectURL(mainImagePreview.previewUrl);
        setMainImagePreview(null);
      }
    } else {
      setGalleryPreviews(prev => {
        const filtered = prev.filter(p => p.previewUrl !== previewUrl);
        URL.revokeObjectURL(previewUrl);
        return filtered;
      });
    }
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to upload images');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          'Invalid file type. Only JPG, PNG and WebP are allowed'
        );
      }

      const fileExt = file.type.split('/')[1];
      const fileName = `${Date.now()}-${Math.random()
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

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: '',
      material_name: '',
      category: '',
      currency: 'PHP',
      quantity: 0,
      unit: '',
      price_per_unit: 0,
      description: '',
      lead_time_days: 0,
      minimum_order_qty: 0,
      maximum_order_qty: 0,
      payment_terms: '',
      delivery_terms: '',
      supplier_notes: '',
      supplier_contact: '',
      supplier_email: '',
      availability_date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setUploading(true);

      if (!values.supplier_id) {
        throw new Error('Supplier is required');
      }

      let mainImageUrl = '';
      if (mainImagePreview) {
        mainImageUrl = await uploadToStorage(mainImagePreview.file);
      }

      const galleryUrls = await Promise.all(
        galleryPreviews.map(preview => uploadToStorage(preview.file))
      );

      const totalPrice = values.quantity * values.price_per_unit;
      await supplierOfferService.createOffer({
        ...values,
        total_price: totalPrice,
        status: 'Pending',
        image_url: mainImageUrl,
        gallery: galleryUrls
      });

      toast.success('Supplier offer submitted successfully');
      onClose?.();
    } catch (error) {
      console.error('Error submitting supplier offer:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit offer'
      );
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  const ImageUploadPreview = ({
    url,
    onRemove,
    isMain = false
  }: {
    url: string;
    onRemove: () => void;
    isMain?: boolean;
  }) => (
    <div className="group relative h-24 w-24 overflow-hidden rounded-xl">
      <img
        src={url}
        alt="Offer preview"
        className="h-full w-full object-cover transition-transform group-hover:scale-110"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
          <Trash2 size={16} />
        </button>
      </div>
      {isMain && (
        <span className="absolute left-2 top-2 rounded-md bg-primary/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Main
        </span>
      )}
    </div>
  );

  const ImageUploadButton = ({
    onUpload,
    multiple = false,
    loading = false
  }: {
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    loading?: boolean;
  }) => (
    <div className="relative h-24 w-24">
      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary/50 hover:bg-slate-100">
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={onUpload}
          disabled={loading}
        />
        {loading ? (
          <Loader2 size={24} className="animate-spin text-slate-400" />
        ) : (
          <>
            <Plus size={24} className="text-slate-400" />
            <span className="mt-1 text-xs text-slate-500">
              {multiple ? 'Add Images' : 'Add Image'}
            </span>
          </>
        )}
      </label>
    </div>
  );

  return (
    <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900">
          New Supplier Offer
        </h2>
      </div>

      {/* Modal Body - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Supplier
              </Label>
              <Select
                onValueChange={value => {
                  console.log('Selected supplier:', value);
                  if (value && typeof value === 'string') {
                    form.setValue('supplier_id', value, {
                      shouldValidate: true
                    });
                  }
                }}>
                <SelectTrigger
                  className={`w-full border ${
                    form.formState.errors.supplier_id
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white px-3 py-2 text-sm`}>
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Select supplier">
                      {suppliers.find(
                        s => s.id === form.getValues('supplier_id')
                      )?.name || 'Select supplier'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.supplier_id && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.supplier_id.message}
                </p>
              )}
            </div>

            {/* Material Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Material Name
              </Label>
              <Input
                {...form.register('material_name')}
                className={`w-full border ${
                  form.formState.errors.material_name
                    ? 'border-red-500'
                    : 'border-slate-200'
                } rounded-xl bg-white px-3 py-2 text-sm`}
                placeholder="Enter material name"
              />
              {form.formState.errors.material_name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.material_name.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Category
              </Label>
              <Input
                {...form.register('category')}
                className={`w-full border ${
                  form.formState.errors.category
                    ? 'border-red-500'
                    : 'border-slate-200'
                } rounded-xl bg-white px-3 py-2 text-sm`}
                placeholder="Enter category"
              />
              {form.formState.errors.category && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            {/* Quantity and Unit */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Quantity
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  {...form.register('quantity')}
                  className={`w-2/3 border ${
                    form.formState.errors.quantity
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white px-3 py-2 text-sm`}
                  placeholder="Enter quantity"
                />
                <Input
                  {...form.register('unit')}
                  className={`w-1/3 border ${
                    form.formState.errors.unit
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white px-3 py-2 text-sm`}
                  placeholder="Unit"
                />
              </div>
              {(form.formState.errors.quantity ||
                form.formState.errors.unit) && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.quantity?.message ||
                    form.formState.errors.unit?.message}
                </p>
              )}
            </div>

            {/* Price and Currency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Price per Unit
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('price_per_unit')}
                  className={`w-2/3 border ${
                    form.formState.errors.price_per_unit
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white px-3 py-2 text-sm`}
                  placeholder="Enter price"
                />
                <Select
                  onValueChange={value =>
                    form.setValue('currency', value, {
                      shouldValidate: true
                    })
                  }
                  defaultValue="PHP">
                  <SelectTrigger className="w-1/3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHP">PHP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Availability Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  {...form.register('availability_date')}
                  className={`w-full border ${
                    form.formState.errors.availability_date
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                />
              </div>
            </div>

            {/* Lead Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Lead Time (days)
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  {...form.register('lead_time_days')}
                  className={`w-full border ${
                    form.formState.errors.lead_time_days
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                  placeholder="Enter lead time in days"
                />
              </div>
            </div>

            {/* Min/Max Order Quantity */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Order Quantity Limits
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    {...form.register('minimum_order_qty')}
                    className={`w-full border ${
                      form.formState.errors.minimum_order_qty
                        ? 'border-red-500'
                        : 'border-slate-200'
                    } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                    placeholder="Min qty"
                  />
                </div>
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    {...form.register('maximum_order_qty')}
                    className={`w-full border ${
                      form.formState.errors.maximum_order_qty
                        ? 'border-red-500'
                        : 'border-slate-200'
                    } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                    placeholder="Max qty"
                  />
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Payment Terms
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  {...form.register('payment_terms')}
                  className={`w-full border ${
                    form.formState.errors.payment_terms
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                  placeholder="Enter payment terms"
                />
              </div>
            </div>

            {/* Delivery Terms */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Delivery Terms
              </Label>
              <div className="relative">
                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  {...form.register('delivery_terms')}
                  className={`w-full border ${
                    form.formState.errors.delivery_terms
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                  placeholder="Enter delivery terms"
                />
              </div>
            </div>

            {/* Supplier Contact */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Contact Person
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  {...form.register('supplier_contact')}
                  className={`w-full border ${
                    form.formState.errors.supplier_contact
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                  placeholder="Enter contact person"
                />
              </div>
            </div>

            {/* Supplier Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Contact Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  {...form.register('supplier_email')}
                  className={`w-full border ${
                    form.formState.errors.supplier_email
                      ? 'border-red-500'
                      : 'border-slate-200'
                  } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
                  placeholder="Enter contact email"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Description
            </Label>
            <Textarea
              {...form.register('description')}
              className={`w-full border ${
                form.formState.errors.description
                  ? 'border-red-500'
                  : 'border-slate-200'
              } rounded-xl bg-white px-3 py-2 text-sm`}
              placeholder="Enter description"
            />
          </div>

          {/* Supplier Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Supplier Notes
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Textarea
                {...form.register('supplier_notes')}
                className={`w-full border ${
                  form.formState.errors.supplier_notes
                    ? 'border-red-500'
                    : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm min-h-[100px]`}
                placeholder="Enter any additional notes"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-900">
              Main Image
            </Label>
            <div className="flex items-start space-x-4">
              {mainImagePreview ? (
                <ImageUploadPreview
                  url={mainImagePreview.previewUrl}
                  onRemove={() =>
                    removePreview(mainImagePreview.previewUrl, true)
                  }
                  isMain
                />
              ) : (
                <ImageUploadButton
                  onUpload={e => handleImageSelect(e, false)}
                  loading={uploading}
                />
              )}
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  This will be the main image displayed for your offer. Choose a
                  clear, high-quality image.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-slate-900">
                Gallery Images
              </Label>
              <span className="text-xs text-slate-500">
                {galleryPreviews.length} of 5 images
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {galleryPreviews.map((preview, index) => (
                <ImageUploadPreview
                  key={`preview-${index}`}
                  url={preview.previewUrl}
                  onRemove={() => removePreview(preview.previewUrl)}
                />
              ))}
              {galleryPreviews.length < 5 && (
                <ImageUploadButton
                  onUpload={e => handleImageSelect(e, true)}
                  multiple
                  loading={uploading}
                />
              )}
            </div>
            <p className="text-sm text-slate-500">
              Add up to 5 images to showcase different angles and details of
              your offer.
            </p>
          </div>
        </form>
      </div>

      {/* Modal Footer */}
      <div className="sticky bottom-0 z-10 rounded-b-xl bg-white px-6 py-4 border-t border-slate-200">
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
            disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="relative rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:bg-primary/50">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Offer</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
