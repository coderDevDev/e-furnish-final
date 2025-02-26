'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Product } from '@/types/product.types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  product?: Product | null;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Please select a category'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Price must be a positive number'
    }),
  stock: z
    .string()
    .min(1, 'Stock is required')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Stock must be a non-negative number'
    }),
  rating: z
    .string()
    .optional()
    .refine(
      val =>
        !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 5),
      {
        message: 'Rating must be between 0 and 5'
      }
    ),
  sales_count: z
    .string()
    .optional()
    .refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Sales count must be a non-negative number'
    })
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product
}: ProductModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      rating: '5',
      sales_count: '0'
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    srcurl: '',
    gallery: [] as string[],
    rating: '',
    sales_count: ''
  });

  const [mainImagePreview, setMainImagePreview] = useState<ImagePreview | null>(
    null
  );
  const [galleryPreviews, setGalleryPreviews] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);

  // Initialize Supabase client
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description || '',
        category: product.category,
        price: product.price.toString(),
        stock: product.stock?.toString() || '0',
        rating: product.rating?.toString() || '',
        sales_count: product.sales_count?.toString() || '0'
      });
      setFormData({
        title: product.title,
        description: product.description || '',
        category: product.category,
        price: product.price.toString(),
        srcurl: product.srcurl,
        gallery: product.gallery || [],
        rating: product.rating?.toString() || '',
        sales_count: product.sales_count?.toString() || '0'
      });
    }
  }, [product, reset]);

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

  // Function to remove image from Supabase Storage
  const removeImageFromStorage = async (url: string) => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to delete images');
      }

      // Extract file path from URL
      const path = url.split('/').pop();
      if (!path) return;

      const { error } = await supabase.storage
        .from('product-images')
        .remove([path]);

      if (error) {
        console.error('Storage delete error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove image'
      );
    }
  };

  // Function to handle removing existing images
  const removeImage = async (url: string, isMainImage = false) => {
    try {
      // Remove from storage
      await removeImageFromStorage(url);

      // Update form data
      if (isMainImage) {
        setFormData(prev => ({
          ...prev,
          srcurl: '',
          gallery: prev.gallery.filter(img => img !== url)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          gallery: prev.gallery.filter(img => img !== url)
        }));
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    try {
      // Check if user is authenticated
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to upload images');
      }

      //console.log({ file });
      // Validate file size (e.g., 5MB limit)
      // const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      // if (file.size > MAX_SIZE) {
      //   throw new Error('File size too large (max 5MB)');
      // }

      // Validate file type
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

      // Changed from 'products' to 'product-images'
      const { error: uploadError, data } = await supabase.storage
        .from('product-images') // Make sure this matches your bucket name
        .upload(fileName, file, {
          // Removed 'images/' prefix
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      if (!data?.path) {
        throw new Error('Upload failed - no path returned');
      }

      // Get public URL - update bucket name here too
      const {
        data: { publicUrl }
      } = supabase.storage.from('product-images').getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const onSubmit = async (formData: ProductFormData) => {
    try {
      setUploading(true);

      // Upload main image if changed
      let mainImageUrl = product?.srcurl || '';
      if (mainImagePreview) {
        mainImageUrl = await uploadToStorage(mainImagePreview.file);
      }

      // Upload gallery images if any new ones
      const existingGallery = product?.gallery || [];
      const newGalleryUrls = await Promise.all(
        galleryPreviews.map(preview => uploadToStorage(preview.file))
      );

      // Combine all data
      const productData = {
        ...(product?.id ? { id: product.id } : {}), // Only include ID for updates
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        rating: formData.rating ? parseFloat(formData.rating) : null,
        sales_count: formData.sales_count ? parseInt(formData.sales_count) : 0,
        srcurl: mainImageUrl,
        gallery: [...existingGallery, ...newGalleryUrls]
      };

      // Save to database
      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save product'
      );
    } finally {
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
        alt="Product preview"
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

  const FormField = ({
    label,
    name,
    type = 'text',
    ...props
  }: {
    label: string;
    name: keyof ProductFormData;
    type?: string;
    [key: string]: any;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1">
        {props.as === 'textarea' ? (
          <textarea
            {...register(name)}
            className={`w-full rounded-xl border ${
              errors[name] ? 'border-red-300' : 'border-slate-200'
            } px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
            {...props}
          />
        ) : props.as === 'select' ? (
          <select
            {...register(name)}
            className={`w-full rounded-xl border ${
              errors[name] ? 'border-red-300' : 'border-slate-200'
            } px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
            {...props}>
            {props.children}
          </select>
        ) : (
          <input
            type={type}
            {...register(name)}
            className={`w-full rounded-xl border ${
              errors[name] ? 'border-red-300' : 'border-slate-200'
            } px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
            {...props}
          />
        )}
        {errors[name] && (
          <div className="absolute right-0 top-0 flex h-full items-center pr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      {errors[name] && (
        <p className="mt-1 text-sm text-red-500">{errors[name]?.message}</p>
      )}
    </div>
  );

  // Create a submit handler function
  const submitForm = () => {
    const form = document.getElementById('product-form') as HTMLFormElement;
    form.requestSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white">
        {/* Modal Header - Fixed */}
        <div className="sticky top-0 z-10 rounded-t-2xl bg-white px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form wraps both content and footer */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          id="product-form"
          className="flex flex-col">
          {/* Modal Content - Scrollable */}
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-4 space-y-4">
            <FormField label="Product Name" name="title" />

            <div>
              {/* <label className="block text-sm font-medium text-slate-700">
                Category
              </label> */}
              <div className="relative mt-1">
                <FormField label="Category" name="category" as="select">
                  <option value="">Select a category</option>
                  <option value="Sofas">Sofas</option>
                  <option value="Chairs">Chairs</option>
                  <option value="Tables">Tables</option>
                  <option value="Bed">Bed</option>
                  <option value="Cabinet">Cabinet</option>
                </FormField>
                {errors.category && (
                  <div className="absolute right-0 top-0 flex h-full items-center pr-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {/* {errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.category.message}
                </p>
              )} */}
            </div>

            {/* Description Field */}
            <FormField
              label="Description"
              name="description"
              as="textarea"
              rows={7}
              placeholder="Enter product description"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />

            {/* Price and Stock Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Price"
                name="price"
                type="number"
                min="0"
                step="0.01"
              />
              <FormField
                label="Stock"
                name="stock"
                type="number"
                min="0"
                step="1"
              />
            </div>

            {/* Rating and Sales Count Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Rating"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
              />
              <FormField
                label="Sales Count"
                name="sales_count"
                type="number"
                min="0"
                step="1"
              />
            </div>

            {/* Main Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Main Image
              </label>
              <div className="flex items-start space-x-4">
                {mainImagePreview ? (
                  <ImageUploadPreview
                    url={mainImagePreview.previewUrl}
                    onRemove={() =>
                      removePreview(mainImagePreview.previewUrl, true)
                    }
                    isMain
                  />
                ) : formData.srcurl ? (
                  <ImageUploadPreview
                    url={formData.srcurl}
                    onRemove={() => removeImage(formData.srcurl, true)}
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
                    This will be the main image displayed for your product.
                    Choose a clear, high-quality image that best represents your
                    product.
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Images Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Gallery Images
                </label>
                <span className="text-xs text-slate-500">
                  {formData.gallery.length} of 5 images
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {formData.gallery.map((url, index) => (
                  <ImageUploadPreview
                    key={`existing-${index}`}
                    url={url}
                    onRemove={() => removeImage(url)}
                  />
                ))}
                {galleryPreviews.map((preview, index) => (
                  <ImageUploadPreview
                    key={`preview-${index}`}
                    url={preview.previewUrl}
                    onRemove={() => removePreview(preview.previewUrl)}
                  />
                ))}
                {formData.gallery.length + galleryPreviews.length < 5 && (
                  <ImageUploadButton
                    onUpload={e => handleImageSelect(e, true)}
                    multiple
                    loading={uploading}
                  />
                )}
              </div>
              <p className="text-sm text-slate-500">
                Add up to 5 images to showcase different angles and details of
                your product.
              </p>
            </div>
          </div>

          {/* Modal Footer - Fixed */}
          <div className="sticky bottom-0 z-10 rounded-b-2xl bg-white px-6 py-4 border-t border-slate-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={submitForm}
                disabled={isSubmitting || uploading}
                className="relative rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:bg-primary/50">
                {isSubmitting || uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    <span>{uploading ? 'Uploading...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{product ? 'Update Product' : 'Add Product'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
