import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Package,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Truck,
  AlertCircle
} from 'lucide-react';
import type { SupplierOffer } from '@/types/inventory.types';

interface SupplierOfferDetailsModalProps {
  offer: SupplierOffer;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export default function SupplierOfferDetailsModal({
  offer,
  onClose,
  onApprove,
  onReject,
  isLoading
}: SupplierOfferDetailsModalProps) {
  return (
    <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-lg">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900">Offer Details</h2>
      </div>

      {/* Modal Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Material Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Material:</span>
                <span className="text-sm">{offer.material_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{offer.category}</span>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Supplier Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Contact:</span>
                <span className="text-sm">{offer.supplier_contact}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{offer.supplier_email}</span>
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Pricing Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Price per Unit:</span>
                <span className="text-sm">
                  {offer.currency}{' '}
                  {offer.price_per_unit.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Quantity:</span>
                <span className="text-sm">
                  {offer.quantity} {offer.unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Price:</span>
                <span className="text-sm font-semibold text-primary">
                  {offer.currency}{' '}
                  {offer.total_price.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Delivery Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Availability:</span>
                <span className="text-sm">
                  {format(new Date(offer.availability_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Lead Time:</span>
                <span className="text-sm">{offer.lead_time_days} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Delivery Terms:</span>
                <span className="text-sm">{offer.delivery_terms}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="col-span-2 space-y-4">
            <h3 className="font-medium text-slate-900">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium">Description:</span>
                <p className="mt-1 text-sm text-slate-600">
                  {offer.description}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="mt-1 text-sm text-slate-600">
                  {offer.supplier_notes}
                </p>
              </div>
            </div>
          </div>

          {/* Images */}
          {(offer.image_url || (offer.gallery && offer.gallery.length > 0)) && (
            <div className="col-span-2 space-y-4">
              <h3 className="font-medium text-slate-900">Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {offer.image_url && (
                  <img
                    src={offer.image_url}
                    alt="Main"
                    className="rounded-lg object-cover aspect-square"
                  />
                )}
                {offer.gallery?.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Gallery ${idx + 1}`}
                    className="rounded-lg object-cover aspect-square"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="sticky bottom-0 z-10 rounded-b-xl bg-white px-6 py-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge
              className={
                offer.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : offer.status === 'Accepted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }>
              {offer.status}
            </Badge>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-xl">
              Close
            </Button>
            {offer.status === 'Pending' && (
              <>
                <Button
                  onClick={() => onReject(offer.id)}
                  variant="outline"
                  disabled={isLoading}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                  Reject
                </Button>
                <Button
                  onClick={() => onApprove(offer.id)}
                  disabled={isLoading}
                  className="rounded-xl bg-primary text-white hover:bg-primary/90">
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
