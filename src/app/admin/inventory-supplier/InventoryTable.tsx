'use client';

import { useState, useRef } from 'react';
import type {
  InventoryItem,
  Supplier,
  Category
} from '@/types/inventory.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Edit,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Trash2,
  Tag,
  Settings,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import UpdateInventoryForm from './UpdateInventoryForm';
import { toast } from 'sonner';
import ProductModal from '@/components/admin/products/ProductModal';
import CategoryModal from '@/components/admin/categories/CategoryModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { customizationService } from '@/lib/services/customizationService';
import { useFieldArray } from 'react-hook-form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { v4 as uuidv4 } from 'uuid';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface InventoryTableProps {
  products: InventoryItem[];
  suppliers: Supplier[];
  categories: Category[];
  onUpdate: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (
    data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

// Updated schema with carve option
const customizationSchema = z.object({
  fields: z.object({
    woodType: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('dropdown'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher')
          })
        )
        .default([])
    }),
    woodFinish: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('dropdown'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher')
          })
        )
        .default([])
    }),
    size: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('dimensions'),
      pricePerUnit: z.coerce.number().min(0, 'Price must be 0 or higher')
    }),
    engraving: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('text'),
      basePrice: z.coerce.number().min(0, 'Price must be 0 or higher'),
      pricePerLetter: z.coerce.number().min(0, 'Price must be 0 or higher')
    }),
    engravingFont: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('dropdown'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher')
          })
        )
        .default([])
    }),
    carve: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('design'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Design name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher'),
            imageUrl: z.string().optional()
          })
        )
        .default([])
    }),
    woodStain: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('color'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher'),
            color: z.string().default('#000000')
          })
        )
        .default([])
    }),
    paintColor: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('color'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher'),
            color: z.string().default('#000000')
          })
        )
        .default([])
    }),
    accentColor: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('color'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher'),
            color: z.string().default('#000000')
          })
        )
        .default([])
    }),
    customColorMatch: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('file'),
      flatFee: z.coerce.number().min(0, 'Fee must be 0 or higher')
    }),
    addOns: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('multi-select'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher')
          })
        )
        .default([])
    }),
    assemblyRequired: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('toggle'),
      flatFee: z.coerce.number().min(0, 'Fee must be 0 or higher')
    }),
    protectiveCoating: z.object({
      enabled: z.boolean().default(true),
      fieldType: z.string().default('dropdown'),
      options: z
        .array(
          z.object({
            name: z.string().min(1, 'Option name is required'),
            price: z.coerce.number().min(0, 'Price must be 0 or higher')
          })
        )
        .default([])
    })
  }),
  pricing: z.object({
    calculationMethod: z
      .enum(['additive', 'replacement', 'percentage'])
      .default('additive'),
    showBreakdown: z.boolean().default(true)
  })
});

type CustomizationFormValues = z.infer<typeof customizationSchema>;

// Add this after your type CustomizationFormValues definition
const defaultCustomizationValues = {
  fields: {
    woodType: {
      enabled: true,
      fieldType: 'dropdown',
      options: [
        { name: 'Mahogany', price: 1000 },
        { name: 'Narra', price: 1500 },
        { name: 'Acacia', price: 800 }
      ]
    },
    woodFinish: {
      enabled: true,
      fieldType: 'dropdown',
      options: [
        { name: 'Matte', price: 200 },
        { name: 'Glossy', price: 300 },
        { name: 'Natural', price: 0 }
      ]
    },
    size: {
      enabled: true,
      fieldType: 'dimensions',
      pricePerUnit: 100
    },
    engraving: {
      enabled: true,
      fieldType: 'text',
      basePrice: 150,
      pricePerLetter: 10
    },
    engravingFont: {
      enabled: true,
      fieldType: 'dropdown',
      options: [
        { name: 'Serif', price: 0 },
        { name: 'Script', price: 50 },
        { name: 'Sans Serif', price: 0 }
      ]
    },
    carve: {
      enabled: true,
      fieldType: 'design',
      options: []
    },
    woodStain: {
      enabled: true,
      fieldType: 'color',
      options: [
        { name: 'Walnut', price: 100, color: '#5E3B24' },
        { name: 'Cherry', price: 150, color: '#711A0E' },
        { name: 'Natural Brown', price: 50, color: '#B07C56' }
      ]
    },
    paintColor: {
      enabled: true,
      fieldType: 'color',
      options: [
        { name: 'White', price: 0, color: '#FFFFFF' },
        { name: 'Black', price: 0, color: '#000000' },
        { name: 'Gray', price: 0, color: '#808080' },
        { name: 'Pastel Blue', price: 50, color: '#A6CFE2' }
      ]
    },
    accentColor: {
      enabled: true,
      fieldType: 'color',
      options: [
        { name: 'Gold', price: 200, color: '#FFD700' },
        { name: 'Silver', price: 150, color: '#C0C0C0' },
        { name: 'Copper', price: 100, color: '#B87333' }
      ]
    },
    customColorMatch: {
      enabled: true,
      fieldType: 'file',
      flatFee: 250
    },
    addOns: {
      enabled: true,
      fieldType: 'multi-select',
      options: [
        { name: 'Drawer', price: 500 },
        { name: 'Glass Door', price: 800 },
        { name: 'Divider', price: 300 },
        { name: 'LED Lighting', price: 1200 }
      ]
    },
    assemblyRequired: {
      enabled: true,
      fieldType: 'toggle',
      flatFee: 1000
    },
    protectiveCoating: {
      enabled: true,
      fieldType: 'dropdown',
      options: [
        { name: 'Varnish', price: 300 },
        { name: 'Lacquer', price: 500 },
        { name: 'Polyurethane', price: 700 }
      ]
    }
  },
  pricing: {
    calculationMethod: 'additive',
    showBreakdown: true
  }
};

// Improved OptionManager Component
const OptionManager = ({
  control,
  name,
  isColor = false,
  disabled = false
}: {
  control: any;
  name: string;
  isColor?: boolean;
  disabled?: boolean;
}) => {
  const [newOption, setNewOption] = useState({
    name: '',
    price: 0,
    color: '#6366f1' // Default indigo color
  });
  const [newOptionErrors, setNewOptionErrors] = useState<{
    name?: string;
    price?: string;
  }>({});

  const { fields, append, remove, update } = useFieldArray({
    control,
    name
  });

  // Validate new option before adding
  const validateNewOption = () => {
    const errors: { name?: string; price?: string } = {};

    if (!newOption.name.trim()) {
      errors.name = 'Name is required';
    }

    if (isNaN(newOption.price) || newOption.price < 0) {
      errors.price = 'Price must be 0 or higher';
    }

    setNewOptionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOption = () => {
    if (!validateNewOption()) return;

    append({
      name: newOption.name,
      price: newOption.price,
      ...(isColor && { color: newOption.color })
    });

    // Reset for next entry
    setNewOption({
      name: '',
      price: 0,
      color: '#6366f1'
    });
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Existing Options */}
      {fields.length > 0 && (
        <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 items-center border p-3 rounded-md bg-gray-50">
              {/* Color swatch (for color fields) */}
              {isColor && (
                <div className="col-span-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-8 h-8 p-0 rounded-md"
                        style={{
                          backgroundColor: field.color || '#000000',
                          borderColor:
                            field.color === '#ffffff' ? '#e5e7eb' : field.color
                        }}
                        disabled={disabled}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <div className="space-y-3">
                        <HexColorPicker
                          color={field.color || '#000000'}
                          onChange={color => {
                            update(index, {
                              ...field,
                              color
                            });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#</span>
                          <HexColorInput
                            color={field.color || '#000000'}
                            onChange={color => {
                              update(index, {
                                ...field,
                                color: `#${color}`
                              });
                            }}
                            prefixed={false}
                            className="w-full border px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Option name */}
              <div className={isColor ? 'col-span-5' : 'col-span-6'}>
                <Controller
                  name={`${name}.${index}.name`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        {...field}
                        placeholder="Option name"
                        disabled={disabled}
                        className={fieldState.error ? 'border-red-500' : ''}
                      />
                      {fieldState.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Price */}
              <div className="col-span-4">
                <Controller
                  name={`${name}.${index}.price`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <div className="flex items-center">
                        <span className="mr-1 text-gray-500">₱</span>
                        <Input
                          {...field}
                          type="number"
                          step="any"
                          placeholder="Price"
                          disabled={disabled}
                          className={fieldState.error ? 'border-red-500' : ''}
                        />
                      </div>
                      {fieldState.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Remove button */}
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new option form */}
      <div className="grid grid-cols-12 gap-2 items-end">
        {/* Color picker for new option */}
        {isColor && (
          <div className="col-span-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-8 h-8 p-0 rounded-md"
                  style={{
                    backgroundColor: newOption.color,
                    borderColor:
                      newOption.color === '#ffffff'
                        ? '#e5e7eb'
                        : newOption.color
                  }}
                  disabled={disabled}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                  <HexColorPicker
                    color={newOption.color}
                    onChange={color => setNewOption({ ...newOption, color })}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">#</span>
                    <HexColorInput
                      color={newOption.color}
                      onChange={color =>
                        setNewOption({ ...newOption, color: `#${color}` })
                      }
                      prefixed={false}
                      className="w-full border px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Name input */}
        <div className={isColor ? 'col-span-5' : 'col-span-6'}>
          <div>
            <Input
              placeholder="Option name"
              value={newOption.name}
              onChange={e =>
                setNewOption({ ...newOption, name: e.target.value })
              }
              disabled={disabled}
              className={newOptionErrors.name ? 'border-red-500' : ''}
            />
            {newOptionErrors.name && (
              <p className="text-xs text-red-500 mt-1">
                {newOptionErrors.name}
              </p>
            )}
          </div>
        </div>

        {/* Price input */}
        <div className="col-span-4">
          <div>
            <div className="flex items-center">
              <span className="mr-1 text-gray-500">₱</span>
              <Input
                type="number"
                step="any"
                placeholder="Price"
                value={newOption.price}
                onChange={e =>
                  setNewOption({
                    ...newOption,
                    price: parseFloat(e.target.value) || 0
                  })
                }
                disabled={disabled}
                className={newOptionErrors.price ? 'border-red-500' : ''}
              />
            </div>
            {newOptionErrors.price && (
              <p className="text-xs text-red-500 mt-1">
                {newOptionErrors.price}
              </p>
            )}
          </div>
        </div>

        {/* Add button */}
        <div className="col-span-2">
          <Button
            type="button"
            onClick={handleAddOption}
            disabled={disabled}
            className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Guide text */}
      {fields.length === 0 && (
        <p className="text-sm text-gray-500 italic mt-2">
          No options added yet. Add your first option above.
        </p>
      )}
    </div>
  );
};

// Add this function near the DesignManager component
async function uploadImageToSupabase(file: File): Promise<string | null> {
  try {
    const supabase = createClientComponentClient();

    // Check if the bucket exists, create it if it doesn't
    const { data: bucketData, error: bucketError } =
      await supabase.storage.getBucket('carve-designs');

    if (bucketError && bucketError.message.includes('does not exist')) {
      // Create the bucket if it doesn't exist
      const { error: createBucketError } = await supabase.storage.createBucket(
        'carve-designs',
        {
          public: true, // Make files publicly accessible
          fileSizeLimit: 5242880, // 5MB limit
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
        }
      );

      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        return null;
      }
    }

    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('carve-designs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    // Get the public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from('carve-designs').getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    return null;
  }
}

// Now update the DesignManager component with the working upload functionality
const DesignManager = ({
  control,
  name,
  disabled = false
}: {
  control: any;
  name: string;
  disabled?: boolean;
}) => {
  // Add these state variables
  const [newDesign, setNewDesign] = useState({
    name: '',
    price: 0,
    imageUrl: ''
  });
  const [newOptionErrors, setNewOptionErrors] = useState<{
    name?: string;
    price?: string;
    imageUrl?: string;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { fields, append, remove, update } = useFieldArray({
    control,
    name
  });

  // Validate new design before adding
  const validateNewDesign = () => {
    const errors: { name?: string; price?: string; imageUrl?: string } = {};

    if (!newDesign.name.trim()) {
      errors.name = 'Design name is required';
    }

    if (isNaN(newDesign.price) || newDesign.price < 0) {
      errors.price = 'Price must be 0 or higher';
    }

    if (!newDesign.imageUrl) {
      errors.imageUrl = 'Please upload a design image';
    }

    setNewOptionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddDesign = () => {
    if (!validateNewDesign()) return;

    append({
      name: newDesign.name,
      price: newDesign.price,
      imageUrl: newDesign.imageUrl
    });

    // Reset for next entry
    setNewDesign({
      name: '',
      price: 0,
      imageUrl: ''
    });
    setNewOptionErrors({});
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setNewOptionErrors({
        ...newOptionErrors,
        imageUrl: 'Only JPG and PNG images are allowed'
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setNewOptionErrors({
        ...newOptionErrors,
        imageUrl: 'File size must be less than 2MB'
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress (since Supabase doesn't have progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 10;
          return next < 90 ? next : 90;
        });
      }, 300);

      // Upload to Supabase
      const publicUrl = await uploadImageToSupabase(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (publicUrl) {
        setNewDesign({
          ...newDesign,
          imageUrl: publicUrl
        });
        setNewOptionErrors({
          ...newOptionErrors,
          imageUrl: undefined
        });

        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast.success('Design image uploaded successfully');
      } else {
        setNewOptionErrors({
          ...newOptionErrors,
          imageUrl: 'Failed to upload image'
        });
        toast.error('Failed to upload design image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setNewOptionErrors({
        ...newOptionErrors,
        imageUrl: 'Error uploading image'
      });
      toast.error('Error uploading design image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing designs list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-md p-4 group relative">
            <div className="absolute right-2 top-2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(index)}
                disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col space-y-3">
              {/* Design image preview */}
              <div className="relative h-40 w-full overflow-hidden rounded-md bg-gray-100">
                {field.imageUrl ? (
                  <img
                    src={field.imageUrl}
                    alt={field.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">No image</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium truncate">{field.name}</h4>
                  <p className="text-sm text-gray-600">₱{field.price}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add new design form */}
      <div className="border rounded-md p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add New Design</h4>

        <div className="grid grid-cols-12 gap-4">
          {/* Design image upload */}
          <div className="col-span-12">
            <Label>Design Image</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {/* Image preview */}
              <div className="relative h-32 w-full border-2 border-dashed rounded-md flex items-center justify-center overflow-hidden bg-white">
                {newDesign.imageUrl ? (
                  <>
                    <img
                      src={newDesign.imageUrl}
                      alt="Design preview"
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() =>
                        setNewDesign({ ...newDesign, imageUrl: '' })
                      }
                      disabled={disabled || uploading}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : uploading ? (
                  <div className="flex flex-col items-center justify-center space-y-2 p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Uploading: {Math.round(uploadProgress)}%
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <label
                      htmlFor="design-image-upload"
                      className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <Plus className="h-8 w-8 text-gray-400" />
                        <p className="text-xs text-gray-500">Upload Design</p>
                      </div>
                      <input
                        id="design-image-upload"
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={disabled || uploading}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Design name & price */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label htmlFor="design-name">Design Name</Label>
                  <Input
                    id="design-name"
                    placeholder="Design name"
                    value={newDesign.name}
                    onChange={e =>
                      setNewDesign({ ...newDesign, name: e.target.value })
                    }
                    disabled={disabled || uploading}
                    className={newOptionErrors.name ? 'border-red-500' : ''}
                  />
                  {newOptionErrors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {newOptionErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="design-price">Price</Label>
                  <div className="flex items-center">
                    <span className="mr-1 text-gray-500">₱</span>
                    <Input
                      id="design-price"
                      type="number"
                      step="any"
                      placeholder="Price"
                      value={newDesign.price}
                      onChange={e =>
                        setNewDesign({
                          ...newDesign,
                          price: parseFloat(e.target.value) || 0
                        })
                      }
                      disabled={disabled || uploading}
                      className={newOptionErrors.price ? 'border-red-500' : ''}
                    />
                  </div>
                  {newOptionErrors.price && (
                    <p className="text-xs text-red-500 mt-1">
                      {newOptionErrors.price}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddDesign}
                  disabled={disabled || uploading || !newDesign.imageUrl}
                  className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Design
                </Button>

                {newOptionErrors.imageUrl && !uploading && (
                  <p className="text-xs text-red-500">
                    {newOptionErrors.imageUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide text */}
      {fields.length === 0 && !newDesign.imageUrl && (
        <p className="text-sm text-gray-500 italic">
          No designs added yet. Upload design images and set pricing above.
        </p>
      )}
    </div>
  );
};

export default function InventoryTable({
  products,
  suppliers,
  categories,
  onUpdate,
  onDelete,
  onAdd,
  fetchProducts,
  fetchCategories
}: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Add state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryItem | null>(
    null
  );

  // Add a new state for the customization modal
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [selectedForCustomization, setSelectedForCustomization] =
    useState<InventoryItem | null>(null);

  const itemsPerPage = 8;

  // MOVE THE FORM HOOK INSIDE THE COMPONENT
  const customizationForm = useForm<CustomizationFormValues>({
    resolver: zodResolver(customizationSchema),
    defaultValues: defaultCustomizationValues
  });

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    const searchString = `${product.title} ${product.category}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    if (quantity <= 10)
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleEdit = (product: InventoryItem) => {
    console.log({ product });
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (product: InventoryItem) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Proceed with deletion if confirmed
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setIsLoading(true);
      await onDelete(productToDelete.id);
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);

      // Check for foreign key constraint violation
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('foreign key constraint') ||
        errorMessage.includes('still referenced') ||
        errorMessage.includes('violates foreign key constraint')
      ) {
        toast.error(
          "This product cannot be deleted because it's used in existing orders. You can update its stock to zero or mark it as discontinued instead."
        );
      } else {
        toast.error('Failed to delete product');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (
    data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      setIsLoading(true);
      await onAdd(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: Partial<InventoryItem>) => {
    try {
      setIsLoading(true);
      await onUpdate(selectedProduct?.id || '', data);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (productData: Partial<InventoryItem>) => {
    try {
      if (productData.id) {
        // Update existing product
        await productService.updateProduct(productData.id, productData);
        toast.success('Product updated successfully');
      } else {
        // Create new product without ID (will be generated in service)
        const { id, ...newProductData } = productData;
        await productService.createProduct(newProductData);
        toast.success('Product created successfully');
      }

      // Refresh product list
      fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save product'
      );
    }
  };

  const handleAddCategory = async (data: Omit<Category, 'id'>) => {
    try {
      setIsLoading(true);
      await categoryService.createCategory(data);
      toast.success('Category created successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string, data: Partial<Category>) => {
    try {
      setIsLoading(true);
      await categoryService.updateCategory(id, data);
      toast.success('Category updated successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setIsLoading(true);
      await categoryService.deleteCategory(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);

      // Check for foreign key constraint violation
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('foreign key constraint') ||
        errorMessage.includes('still referenced')
      ) {
        toast.error(
          "This category cannot be deleted because it's used by existing products. Please reassign products first."
        );
      } else {
        toast.error('Failed to delete category');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Replace the existing handleCustomize function with this corrected version
  const handleCustomize = async (product: InventoryItem) => {
    console.log({ product });

    // First, reset the form to clear any previous data
    customizationForm.reset(defaultCustomizationValues);

    // Then set the selected product
    setSelectedProduct(product);
    setSelectedForCustomization(product);
    setCustomizationOpen(true);

    try {
      // Get customization options from API
      const response =
        await customizationService.getProductCustomizationOptions(product.id);

      console.log('API Response:', response);

      // Check if response is valid and is an array (not wrapped in an options property)
      if (response && Array.isArray(response)) {
        // Create a properly structured form values object with defaults
        const formValues: CustomizationFormValues = {
          fields: {
            woodType: { enabled: false, fieldType: 'dropdown', options: [] },
            woodFinish: { enabled: false, fieldType: 'dropdown', options: [] },
            size: { enabled: false, fieldType: 'dimensions', pricePerUnit: 0 },
            engraving: {
              enabled: false,
              fieldType: 'text',
              basePrice: 0,
              pricePerLetter: 0
            },
            engravingFont: {
              enabled: false,
              fieldType: 'dropdown',
              options: []
            },
            carve: { enabled: false, fieldType: 'design', options: [] },
            woodStain: { enabled: false, fieldType: 'color', options: [] },
            paintColor: { enabled: false, fieldType: 'color', options: [] },
            accentColor: { enabled: false, fieldType: 'color', options: [] },
            customColorMatch: { enabled: false, fieldType: 'file', flatFee: 0 },
            addOns: { enabled: false, fieldType: 'multi-select', options: [] },
            assemblyRequired: {
              enabled: false,
              fieldType: 'toggle',
              flatFee: 0
            },
            protectiveCoating: {
              enabled: false,
              fieldType: 'dropdown',
              options: []
            }
          },
          pricing: {
            calculationMethod: 'additive',
            showBreakdown: true
          }
        };

        // Process each option from the API response array
        response.forEach(option => {
          // Handle pricing field separately (if it exists)
          if (option.fieldName === 'pricing') {
            formValues.pricing = {
              calculationMethod: (option.options?.calculationMethod ||
                'additive') as 'additive' | 'replacement' | 'percentage',
              showBreakdown: !!option.options?.showBreakdown
            };
            return;
          }

          // For all other fields
          if (option.fieldName && formValues.fields[option.fieldName]) {
            // Start with basic field properties
            formValues.fields[option.fieldName] = {
              ...formValues.fields[option.fieldName],
              enabled: option.enabled,
              fieldType:
                option.fieldType ||
                formValues.fields[option.fieldName].fieldType
            };

            // Handle options array for fields that support it
            if (option.options && Array.isArray(option.options)) {
              formValues.fields[option.fieldName].options = option.options;
            }

            // Handle pricing impact properties
            if (option.pricingImpact) {
              switch (option.fieldName) {
                case 'size':
                  formValues.fields.size.pricePerUnit =
                    option.pricingImpact.pricePerUnit || 0;
                  break;

                case 'engraving':
                  formValues.fields.engraving.basePrice =
                    option.pricingImpact.basePrice || 0;
                  formValues.fields.engraving.pricePerLetter =
                    option.pricingImpact.pricePerLetter || 0;
                  break;

                case 'customColorMatch':
                case 'assemblyRequired':
                  formValues.fields[option.fieldName].flatFee =
                    option.pricingImpact.flatFee || 0;
                  break;
              }
            }
          }
        });

        console.log('Formatted form values:', formValues);

        // Update the form with the processed values
        customizationForm.reset(formValues);
      }
    } catch (error) {
      console.error('Error loading customization options:', error);
      toast.error('Failed to load customization options');

      // Reset to defaults on error
      customizationForm.reset(defaultCustomizationValues);
    }
  };

  // Add this function to handle saving customization options
  const handleCustomizationSubmit = async (data: CustomizationFormValues) => {
    // Show loading state
    setCustomizationLoading(true);

    try {
      console.log({ selectedProduct });
      if (!selectedProduct?.id) {
        throw new Error('No product selected');
      }

      // Format data for database
      const customizationOptions = Object.entries(data.fields).map(
        ([fieldName, fieldConfig]) => ({
          fieldName,
          fieldType: fieldConfig.fieldType,
          enabled: fieldConfig.enabled,
          options: 'options' in fieldConfig ? fieldConfig.options : undefined,
          pricingImpact: {
            // Handle different pricing structures based on field type
            ...('pricePerUnit' in fieldConfig && {
              pricePerUnit: fieldConfig.pricePerUnit
            }),
            ...('basePrice' in fieldConfig && {
              basePrice: fieldConfig.basePrice
            }),
            ...('pricePerLetter' in fieldConfig && {
              pricePerLetter: fieldConfig.pricePerLetter
            }),
            ...('flatFee' in fieldConfig && { flatFee: fieldConfig.flatFee })
          }
        })
      );

      // Save the data to database
      const success =
        await customizationService.saveProductCustomizationOptions(
          selectedProduct.id,
          customizationOptions
        );

      if (success) {
        toast.success('Customization options saved successfully');
        setCustomizationOpen(false); // Close modal if using one
      } else {
        throw new Error('Failed to save customization options');
      }
    } catch (error) {
      console.error('Error saving customization options:', error);
      toast.error(
        'Failed to save customization options: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setCustomizationLoading(false);
    }
  };

  // Add loading state
  const [customizationLoading, setCustomizationLoading] = useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 transition-all duration-200"
          />
        </div> */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>

          <Button
            onClick={() => {
              setSelectedCategory(null);
              setIsCategoryModalOpen(true);
            }}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10">
            <Tag className="mr-2 h-4 w-4" /> Manage Categories
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Stock</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.srcurl && (
                        <img
                          src={product.srcurl}
                          alt={product.title}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      )}
                      {product.title}
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₱{product.price}</TableCell>
                  <TableCell>{product.stock || 0}</TableCell>
                  <TableCell>{getStockStatus(product.stock || 0)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(product)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCustomize(product)}>
                        <Settings className="h-4 w-4" />
                        <span className="ml-2">Customize</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
        product={selectedProduct}
        categories={categories}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        onAdd={handleAddCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
        categories={categories}
        selectedCategory={selectedCategory}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}>
              No, Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Furniture Customization Modal */}
      <Dialog
        open={customizationOpen}
        onOpenChange={open => {
          if (!open) {
            // Reset the form when the dialog is closed
            customizationForm.reset(defaultCustomizationValues);
            setCustomizationOpen(false);
          }
        }}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto scrollbar-hide    ">
          <FormProvider {...customizationForm}>
            <form
              onSubmit={customizationForm.handleSubmit(
                handleCustomizationSubmit
              )}>
              <DialogHeader>
                <DialogTitle>Furniture Customization Options</DialogTitle>
                <DialogDescription>
                  Configure customization fields for{' '}
                  {selectedForCustomization?.title || 'this product'}
                </DialogDescription>
              </DialogHeader>

              <div className="  ">
                <Tabs defaultValue="fields" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fields">
                      Customization Fields
                    </TabsTrigger>
                    <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
                  </TabsList>

                  <TabsContent value="fields" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-6">
                      {/* WOOD TYPE */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Wood Type</h4>
                          <Controller
                            name="fields.woodType.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Wood Type Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.woodType.options"
                            disabled={
                              !customizationForm.watch(
                                'fields.woodType.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* WOOD FINISH */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Wood Finish</h4>
                          <Controller
                            name="fields.woodFinish.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Wood Finish Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.woodFinish.options"
                            disabled={
                              !customizationForm.watch(
                                'fields.woodFinish.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* SIZE */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Size (Dimensions)</h4>
                          <Controller
                            name="fields.size.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Price Per Unit (cm²)</Label>
                              <Controller
                                name="fields.size.pricePerUnit"
                                control={customizationForm.control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <div className="flex items-center">
                                      <span className="mr-1 text-gray-500">
                                        ₱
                                      </span>
                                      <Input
                                        {...field}
                                        type="number"
                                        step="any"
                                        placeholder="Price per unit"
                                        disabled={
                                          !customizationForm.watch(
                                            'fields.size.enabled'
                                          )
                                        }
                                      />
                                    </div>
                                    {fieldState.error && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {fieldState.error.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            This price will be multiplied by the dimensions
                            (width × height × depth) selected by the customer.
                          </p>
                        </div>
                      </div>

                      {/* ENGRAVING */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Engraving</h4>
                          <Controller
                            name="fields.engraving.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Base Price</Label>
                              <Controller
                                name="fields.engraving.basePrice"
                                control={customizationForm.control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <div className="flex items-center">
                                      <span className="mr-1 text-gray-500">
                                        ₱
                                      </span>
                                      <Input
                                        {...field}
                                        type="number"
                                        step="any"
                                        placeholder="Base price"
                                        disabled={
                                          !customizationForm.watch(
                                            'fields.engraving.enabled'
                                          )
                                        }
                                      />
                                    </div>
                                    {fieldState.error && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {fieldState.error.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              />
                            </div>
                            <div>
                              <Label>Price Per Letter</Label>
                              <Controller
                                name="fields.engraving.pricePerLetter"
                                control={customizationForm.control}
                                render={({ field, fieldState }) => (
                                  <div>
                                    <div className="flex items-center">
                                      <span className="mr-1 text-gray-500">
                                        ₱
                                      </span>
                                      <Input
                                        {...field}
                                        type="number"
                                        step="any"
                                        placeholder="Price per letter"
                                        disabled={
                                          !customizationForm.watch(
                                            'fields.engraving.enabled'
                                          )
                                        }
                                      />
                                    </div>
                                    {fieldState.error && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {fieldState.error.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ENGRAVING FONT */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Engraving Font</h4>
                          <Controller
                            name="fields.engravingFont.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Font Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.engravingFont.options"
                            disabled={
                              !customizationForm.watch(
                                'fields.engravingFont.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* CARVE DESIGNS */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Carve Designs</h4>
                          <Controller
                            name="fields.carve.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Carving Design Options with Pricing</Label>
                          <p className="text-sm text-gray-500 mb-3">
                            Upload design images that customers can choose for
                            carved furniture elements.
                          </p>
                          <DesignManager
                            control={customizationForm.control}
                            name="fields.carve.options"
                            disabled={
                              !customizationForm.watch('fields.carve.enabled')
                            }
                          />
                        </div>
                      </div>

                      {/* WOOD STAIN */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Wood Stain</h4>
                          <Controller
                            name="fields.woodStain.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Wood Stain Colors with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.woodStain.options"
                            isColor={true}
                            disabled={
                              !customizationForm.watch(
                                'fields.woodStain.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* PAINT COLOR */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Paint Color</h4>
                          <Controller
                            name="fields.paintColor.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Paint Color Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.paintColor.options"
                            isColor={true}
                            disabled={
                              !customizationForm.watch(
                                'fields.paintColor.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* ACCENT COLOR */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Accent Color</h4>
                          <Controller
                            name="fields.accentColor.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Accent Color Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.accentColor.options"
                            isColor={true}
                            disabled={
                              !customizationForm.watch(
                                'fields.accentColor.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* CUSTOM COLOR MATCH */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Custom Color Match</h4>
                          <Controller
                            name="fields.customColorMatch.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Flat Fee</Label>
                            <Controller
                              name="fields.customColorMatch.flatFee"
                              control={customizationForm.control}
                              render={({ field, fieldState }) => (
                                <div>
                                  <div className="flex items-center">
                                    <span className="mr-1 text-gray-500">
                                      ₱
                                    </span>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="any"
                                      placeholder="Flat fee"
                                      disabled={
                                        !customizationForm.watch(
                                          'fields.customColorMatch.enabled'
                                        )
                                      }
                                    />
                                  </div>
                                  {fieldState.error && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {fieldState.error.message}
                                    </p>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                          <p className="text-sm text-gray-500">
                            This allows customers to upload an image or provide
                            a color code for exact color matching.
                          </p>
                        </div>
                      </div>

                      {/* ADD-ONS */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Add-ons</h4>
                          <Controller
                            name="fields.addOns.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Add-on Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.addOns.options"
                            disabled={
                              !customizationForm.watch('fields.addOns.enabled')
                            }
                          />
                        </div>
                      </div>

                      {/* ASSEMBLY REQUIRED */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Assembly Service</h4>
                          <Controller
                            name="fields.assemblyRequired.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Flat Fee</Label>
                            <Controller
                              name="fields.assemblyRequired.flatFee"
                              control={customizationForm.control}
                              render={({ field, fieldState }) => (
                                <div>
                                  <div className="flex items-center">
                                    <span className="mr-1 text-gray-500">
                                      ₱
                                    </span>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="any"
                                      placeholder="Flat fee"
                                      disabled={
                                        !customizationForm.watch(
                                          'fields.assemblyRequired.enabled'
                                        )
                                      }
                                    />
                                  </div>
                                  {fieldState.error && (
                                    <p className="text-xs text-red-500 mt-1">
                                      {fieldState.error.message}
                                    </p>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                          <p className="text-sm text-gray-500">
                            Charge this fee if the customer wants the furniture
                            delivered fully assembled.
                          </p>
                        </div>
                      </div>

                      {/* PROTECTIVE COATING */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Protective Coating</h4>
                          <Controller
                            name="fields.protectiveCoating.enabled"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>
                        <div>
                          <Label>Coating Options with Pricing</Label>
                          <OptionManager
                            control={customizationForm.control}
                            name="fields.protectiveCoating.options"
                            disabled={
                              !customizationForm.watch(
                                'fields.protectiveCoating.enabled'
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* PRICING SETTINGS */}
                      <div className="space-y-3 p-4 border rounded-md bg-gray-50">
                        <h4 className="font-medium">Pricing Configuration</h4>
                        <div className="space-y-4">
                          <div>
                            <Label>Calculation Method</Label>
                            <Controller
                              name="pricing.calculationMethod"
                              control={customizationForm.control}
                              render={({ field }) => (
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select calculation method" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="additive">
                                      Additive (Add all options)
                                    </SelectItem>
                                    <SelectItem value="replacement">
                                      Replacement (Replace base price)
                                    </SelectItem>
                                    <SelectItem value="percentage">
                                      Percentage (% of base price)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Controller
                              name="pricing.showBreakdown"
                              control={customizationForm.control}
                              render={({ field }) => (
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="show-breakdown"
                                />
                              )}
                            />
                            <Label htmlFor="show-breakdown">
                              Show price breakdown to customers
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="rounded-md border p-4">
                      <h3 className="font-medium mb-2">Pricing Rules</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Define how customization options affect the final price
                        of your product.
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Base product price</Label>
                          <div className="flex items-center">
                            <span className="mr-2">₱</span>
                            <Input
                              className="w-32"
                              value={selectedForCustomization?.price || 0}
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="block">
                            Price calculation method
                          </Label>
                          <Controller
                            name="pricing.calculationMethod"
                            control={customizationForm.control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select calculation method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="additive">
                                    Additive (options add to base price)
                                  </SelectItem>
                                  <SelectItem value="replacement">
                                    Replacement (options replace base price)
                                  </SelectItem>
                                  <SelectItem value="percentage">
                                    Percentage (options add % to base price)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Show price breakdown to customers</Label>
                            <Controller
                              name="pricing.showBreakdown"
                              control={customizationForm.control}
                              render={({ field }) => (
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              )}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            When enabled, customers will see how each option
                            affects the final price.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-2"
                  onClick={() => {
                    customizationForm.reset(defaultCustomizationValues);
                  }}
                  disabled={customizationLoading}>
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={customizationForm.handleSubmit(
                    handleCustomizationSubmit
                  )}
                  disabled={customizationLoading}>
                  {customizationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
          {filteredProducts.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex gap-1">
            {getPageNumbers().map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-8 bg-primary hover:bg-primary/90 text-white"
                onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
