'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  supplierOfferSchema,
  type SupplierOfferFormData
} from '@/types/inventory.types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SupplierOffer } from '@/types/inventory.types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Building2,
  Phone,
  Mail,
  Package,
  Tags,
  FileText,
  Scale,
  Ruler,
  DollarSign,
  Calendar,
  Clock,
  PackageCheck,
  PackageX,
  CreditCard,
  Truck,
  ClipboardList,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import Image from 'next/image';

const supabase = createClientComponentClient();

interface AddRawMaterialOfferFormProps {
  initialData?: SupplierOffer | null;
  onAdd: (offer: SupplierOfferFormData) => Promise<void>;
  onClose: () => void;
}

const FormField = ({
  label,
  icon: Icon,
  children
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-500" />
      <label className="text-sm font-medium text-gray-700">{label}</label>
    </div>
    {children}
  </div>
);

export default function AddRawMaterialOfferForm({
  initialData,
  onAdd,
  onClose
}: AddRawMaterialOfferFormProps) {
  const [currentSupplier, setCurrentSupplier] = useState<{
    id: string;
    user_id: string;
    name: string;
    phone: string;
    email: string;
  } | null>(null);
  const [tempImages, setTempImages] = useState<Map<string, File>>(new Map());
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch
  } = useForm<SupplierOfferFormData>({
    resolver: zodResolver(supplierOfferSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    fetchCurrentSupplier();
  }, []);

  useEffect(() => {
    if (initialData) {
      // Pre-fill form with initial data
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as keyof SupplierOfferFormData, value);
      });
    }
  }, [initialData, setValue]);

  const fetchCurrentSupplier = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('No authenticated session found');
        return;
      }

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('id, user_id, name, phone, email')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching supplier:', error);
        return;
      }

      if (supplier) {
        setCurrentSupplier(supplier);
        setValue('supplier_id', supplier.id);
        setValue('supplier_name', supplier.name);
        setValue('supplier_contact', supplier.phone);
        setValue('supplier_email', supplier.email);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch supplier details');
    }
  };

  const handleImageUpload = async (files: File[]) => {
    const uploadPromises = files.map(async file => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    });

    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data: SupplierOfferFormData) => {
    try {
      // Upload pending images first
      if (pendingImages.length > 0) {
        const uploadedUrls = await handleImageUpload(pendingImages);

        // Combine existing URLs with new uploaded URLs
        const existingUrls = (data.gallery || []).filter(
          item => typeof item === 'string'
        );
        data.gallery = [...existingUrls, ...uploadedUrls];

        // Set the first image as the main image if there isn't one
        if (!data.image_url && data.gallery.length > 0) {
          data.image_url = data.gallery[0];
        }
      }

      await onAdd(data);
      toast.success('Raw material offer added successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding offer:', error);
      toast.error('Failed to add offer');
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      pendingImages.forEach(file => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [pendingImages]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Material Offer' : 'Add New Material Offer'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Select Supplier" icon={Building2}>
              <Input
                disabled
                type="text"
                placeholder="Enter supplier name"
                {...register('supplier_name')}
              />
              {errors.supplier_id && (
                <p className="text-sm text-red-500">
                  {errors.supplier_id.message}
                </p>
              )}
            </FormField>

            <FormField label="Contact Number" icon={Phone}>
              <Input
                disabled
                type="text"
                placeholder="Enter contact number"
                {...register('supplier_contact')}
              />
              {errors.supplier_contact && (
                <p className="text-sm text-red-500">
                  {errors.supplier_contact.message}
                </p>
              )}
            </FormField>

            <FormField label="Email Address" icon={Mail}>
              <Input
                disabled
                type="email"
                placeholder="Enter email address"
                {...register('supplier_email')}
              />
              {errors.supplier_email && (
                <p className="text-sm text-red-500">
                  {errors.supplier_email.message}
                </p>
              )}
            </FormField>

            <FormField label="Material Name" icon={Package}>
              <Input
                type="text"
                placeholder="Enter material name"
                {...register('material_name')}
              />
              {errors.material_name && (
                <p className="text-sm text-red-500">
                  {errors.material_name.message}
                </p>
              )}
            </FormField>

            <FormField label="Category" icon={Tags}>
              <Input
                type="text"
                placeholder="Enter category"
                {...register('category')}
              />
              {errors.category && (
                <p className="text-sm text-red-500">
                  {errors.category.message}
                </p>
              )}
            </FormField>

            <FormField
              label="Description"
              icon={FileText}
              className="col-span-2">
              <Textarea
                placeholder="Enter description"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </FormField>

            <FormField label="Quantity" icon={Scale}>
              <Input
                type="number"
                placeholder="Enter quantity"
                {...register('quantity')}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">
                  {errors.quantity.message}
                </p>
              )}
            </FormField>

            <FormField label="Unit" icon={Ruler}>
              <Select onValueChange={value => setValue('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="liter">Liter (L)</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit.message}</p>
              )}
            </FormField>

            <FormField label="Price per Unit" icon={DollarSign}>
              <Input
                type="number"
                placeholder="Enter price"
                {...register('price_per_unit')}
              />
              {errors.price_per_unit && (
                <p className="text-sm text-red-500">
                  {errors.price_per_unit.message}
                </p>
              )}
            </FormField>

            <FormField label="Currency" icon={DollarSign}>
              <Select onValueChange={value => setValue('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHP">PHP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500">
                  {errors.currency.message}
                </p>
              )}
            </FormField>

            <FormField label="Availability Date" icon={Calendar}>
              <Input type="date" {...register('availability_date')} />
              {errors.availability_date && (
                <p className="text-sm text-red-500">
                  {errors.availability_date.message}
                </p>
              )}
            </FormField>

            <FormField label="Lead Time (Days)" icon={Clock}>
              <Input
                type="number"
                placeholder="Enter lead time"
                {...register('lead_time_days')}
              />
              {errors.lead_time_days && (
                <p className="text-sm text-red-500">
                  {errors.lead_time_days.message}
                </p>
              )}
            </FormField>

            <FormField label="Minimum Order Quantity" icon={PackageCheck}>
              <Input
                type="number"
                placeholder="Enter minimum quantity"
                {...register('min_order_quantity')}
              />
              {errors.min_order_quantity && (
                <p className="text-sm text-red-500">
                  {errors.min_order_quantity.message}
                </p>
              )}
            </FormField>

            <FormField label="Maximum Order Quantity" icon={PackageX}>
              <Input
                type="number"
                placeholder="Enter maximum quantity"
                {...register('max_order_quantity')}
              />
              {errors.max_order_quantity && (
                <p className="text-sm text-red-500">
                  {errors.max_order_quantity.message}
                </p>
              )}
            </FormField>

            <FormField
              label="Payment Terms"
              icon={CreditCard}
              className="col-span-2">
              <Textarea
                placeholder="Enter payment terms"
                {...register('payment_terms')}
              />
              {errors.payment_terms && (
                <p className="text-sm text-red-500">
                  {errors.payment_terms.message}
                </p>
              )}
            </FormField>

            <FormField
              label="Delivery Terms"
              icon={Truck}
              className="col-span-2">
              <Textarea
                placeholder="Enter delivery terms"
                {...register('delivery_terms')}
              />
              {errors.delivery_terms && (
                <p className="text-sm text-red-500">
                  {errors.delivery_terms.message}
                </p>
              )}
            </FormField>

            <FormField
              label="Additional Notes"
              icon={ClipboardList}
              className="col-span-2">
              <Textarea
                placeholder="Enter any additional notes"
                {...register('supplier_notes')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 mt-4">
            <FormField label="Gallery Images" icon={ImageIcon}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(watch('gallery') || []).map((url, index) => (
                  <div key={index} className="relative aspect-video w-full">
                    <Image
                      fill
                      src={url as string}
                      alt={`Gallery ${index + 1}`}
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const gallery = watch('gallery') || [];
                        setValue(
                          'gallery',
                          gallery.filter((_, i) => i !== index)
                        );
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                        Main Image
                      </div>
                    )}
                  </div>
                ))}

                {pendingImages.map((file, index) => (
                  <div
                    key={`pending-${index}`}
                    className="relative aspect-video w-full">
                    <Image
                      fill
                      src={URL.createObjectURL(file)}
                      alt={`Pending Upload ${index + 1}`}
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPendingImages(current =>
                          current.filter((_, i) => i !== index)
                        );
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                      Pending Upload
                    </div>
                  </div>
                ))}

                <ImageUpload
                  multiple
                  onChange={files => {
                    const newFiles = Array.isArray(files) ? files : [files];
                    setPendingImages(current => [...current, ...newFiles]);
                  }}
                  onRemove={() => {}}
                />
              </div>
            </FormField>
          </div>

          <div className="flex justify-end col-span-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 text-white">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
