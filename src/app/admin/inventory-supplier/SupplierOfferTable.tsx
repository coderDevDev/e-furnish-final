'use client';

import { useState } from 'react';
import type { SupplierOffer } from '@/types/inventory.types';
import { supplierOfferService } from '@/lib/services/supplierOfferService';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Package,
  Calendar,
  Clock,
  Eye,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SupplierOfferDetailsModal from './SupplierOfferDetailsModal';

interface SupplierOfferTableProps {
  offers: SupplierOffer[];
  onRefresh: () => Promise<void>;
}

export default function SupplierOfferTable({
  offers,
  onRefresh
}: SupplierOfferTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<SupplierOffer | null>(
    null
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'approve' | 'reject' | null
  >(null);

  // Filter offers based on search term
  const filteredOffers = offers.filter(offer => {
    const searchString =
      `${offer.material_name} ${offer.category}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await supplierOfferService.deleteOffer(id);
      await onRefresh();
      toast.success('Offer deleted successfully');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setIsLoading(true);
      await supplierOfferService.updateOfferStatus(id, 'Accepted');
      await onRefresh();
      toast.success('Offer approved successfully');
      setIsViewModalOpen(false);
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error('Error approving offer:', error);
      toast.error('Failed to approve offer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setIsLoading(true);
      await supplierOfferService.updateOfferStatus(id, 'Rejected');
      await onRefresh();
      toast.success('Offer rejected successfully');
      setIsViewModalOpen(false);
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast.error('Failed to reject offer');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Accepted: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search offers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Material</TableHead>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Quantity</TableHead>
              <TableHead className="font-semibold">Price/Unit</TableHead>
              <TableHead className="font-semibold">Total</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOffers.map(offer => (
              <TableRow key={offer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {offer.material_name}
                  </div>
                </TableCell>
                <TableCell>{offer.supplier_name}</TableCell>
                <TableCell>{offer.category}</TableCell>
                <TableCell>
                  {offer.quantity} {offer.unit}
                </TableCell>
                <TableCell>
                  {offer.currency} {offer.price_per_unit.toFixed(2)}
                </TableCell>
                <TableCell>
                  {offer.currency} {offer.total_price.toFixed(2)}
                </TableCell>
                <TableCell>{getStatusBadge(offer.status)}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(offer.submitted_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(offer.submitted_at), 'HH:mm')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setIsViewModalOpen(true);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(offer.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredOffers.length)} of{' '}
          {filteredOffers.length} entries
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

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl p-0">
          {selectedOffer && (
            <SupplierOfferDetailsModal
              offer={selectedOffer}
              onClose={() => setIsViewModalOpen(false)}
              onApprove={id => {
                setConfirmAction('approve');
                setIsConfirmModalOpen(true);
              }}
              onReject={id => {
                setConfirmAction('reject');
                setIsConfirmModalOpen(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <AlertDialog
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'approve' ? 'Approve Offer' : 'Reject Offer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{' '}
              {confirmAction === 'approve' ? 'approve' : 'reject'} this offer?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedOffer) return;

                if (confirmAction === 'approve') {
                  await handleApprove(selectedOffer.id);
                } else {
                  await handleReject(selectedOffer.id);
                }
              }}
              disabled={isLoading}
              className={
                confirmAction === 'approve' ? 'bg-primary' : 'bg-destructive'
              }>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {confirmAction === 'approve'
                    ? 'Approving...'
                    : 'Rejecting...'}
                </>
              ) : confirmAction === 'approve' ? (
                'Approve'
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
