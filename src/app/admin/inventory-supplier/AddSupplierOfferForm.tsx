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
import type { Supplier, SupplierOffer } from '@/types/inventory.types';
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
  onAdd: (offer: Omit<SupplierOffer, 'id'>) => Promise<void>;
  onClose: () => void;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

const AddSupplierOfferForm: React.FC<AddSupplierOfferFormProps> = ({
  suppliers,
  onAdd,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<ImagePreview | null>(
    null
  );
  const [galleryPreviews, setGalleryPreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [materialName, setMaterialName] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [supplierId, setSupplierId] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer = {
      material_name: materialName,
      price_per_unit: pricePerUnit,
      quantity,
      supplier_id: supplierId
    };
    await onAdd(newOffer);
    onClose();
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add New Supplier Offer</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Material Name"
            value={materialName}
            onChange={e => setMaterialName(e.target.value)}
            className="mb-4"
          />
          <Input
            type="number"
            placeholder="Price per Unit"
            value={pricePerUnit}
            onChange={e => setPricePerUnit(Number(e.target.value))}
            className="mb-4"
          />
          <Input
            type="number"
            placeholder="Quantity Available"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="mb-4"
          />
          <Select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            className="mb-4">
            <option value="">Select Supplier</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 text-white">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierOfferForm;
