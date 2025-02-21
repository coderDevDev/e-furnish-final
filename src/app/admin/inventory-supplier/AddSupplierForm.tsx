'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Phone, MapPin, X, Loader2 } from 'lucide-react';
import type { Supplier } from '@/types/inventory.types';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required')
});

interface AddSupplierFormProps {
  onAdd: (
    data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onUpdate?: (data: Supplier) => Promise<void>;
  mode?: 'add' | 'update';
  initialData?: Supplier | null;
  onClose?: () => void;
}

export default function AddSupplierForm({
  onAdd,
  onUpdate,
  mode = 'add',
  initialData,
  onClose
}: AddSupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {}
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (mode === 'add') {
        await onAdd(data);
      } else if (onUpdate && initialData) {
        await onUpdate({ ...data, id: initialData.id });
      }
      onClose?.();
    } catch (error) {
      console.error('Error submitting supplier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {mode === 'add' ? 'Add New Supplier' : 'Update Supplier'}
        </h2>
        {/* <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button> */}
      </div>

      {/* Modal Body - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Supplier Name
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('name')}
                placeholder="Enter supplier name"
                className={`w-full border ${
                  errors.name ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Contact Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('contact')}
                type="email"
                placeholder="Enter contact email"
                className={`w-full border ${
                  errors.contact ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
              />
            </div>
            {errors.contact && (
              <p className="text-xs text-red-500">{errors.contact.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('phone')}
                placeholder="Enter phone number"
                className={`w-full border ${
                  errors.phone ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Address
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('address')}
                placeholder="Enter address"
                className={`w-full border ${
                  errors.address ? 'border-red-500' : 'border-slate-200'
                } rounded-xl bg-white pl-9 pr-3 py-2 text-sm`}
              />
            </div>
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* Modal Footer - Fixed */}
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
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="relative rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:bg-primary/50">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                <span>{mode === 'add' ? 'Creating...' : 'Updating...'}</span>
              </>
            ) : (
              <span>
                {mode === 'add' ? 'Create Supplier' : 'Update Supplier'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
