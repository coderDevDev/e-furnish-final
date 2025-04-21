'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Search, FileText, Eye, CheckCircle, XCircle } from 'lucide-react';

type Supplier = {
  id: string;
  created_at: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  business_type: string;
  document_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
};

export default function SupplierApplicationsList() {
  const supabase = createClientComponentClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchSuppliers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('supplier-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers'
        },
        () => {
          fetchSuppliers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load supplier applications');
    } else {
      setSuppliers(data as Supplier[]);
    }
    setLoading(false);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchString =
      `${supplier.business_name} ${supplier.contact_person} ${supplier.email}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const viewSupplierDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsModal(true);
  };

  const openApproveModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowApproveModal(true);
  };

  const openRejectModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowRejectModal(true);
  };

  const approveSupplier = async () => {
    if (!selectedSupplier) return;

    setProcessingAction(true);
    const { error } = await supabase
      .from('suppliers')
      .update({
        status: 'approved',
        notes: notes,
        approved_at: new Date().toISOString()
      })
      .eq('id', selectedSupplier.id);

    setProcessingAction(false);

    if (error) {
      console.error('Error approving supplier:', error);
      toast.error('Failed to approve supplier');
    } else {
      toast.success('Supplier approved successfully');
      setShowApproveModal(false);
      setNotes('');
      // Send email notification to supplier (in a real implementation)
    }
  };

  const rejectSupplier = async () => {
    if (!selectedSupplier) return;

    setProcessingAction(true);
    const { error } = await supabase
      .from('suppliers')
      .update({
        status: 'rejected',
        notes: notes,
        rejected_at: new Date().toISOString()
      })
      .eq('id', selectedSupplier.id);

    setProcessingAction(false);

    if (error) {
      console.error('Error rejecting supplier:', error);
      toast.error('Failed to reject supplier');
    } else {
      toast.success('Supplier rejected');
      setShowRejectModal(false);
      setNotes('');
      // Send email notification to supplier (in a real implementation)
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search applications..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No pending supplier applications
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    {supplier.business_name}
                  </TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>
                    {format(new Date(supplier.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {supplier.document_urls?.length || 0} files
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewSupplierDetails(supplier)}
                        title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => openApproveModal(supplier)}
                        title="Approve">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openRejectModal(supplier)}
                        title="Reject">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Supplier Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
            <DialogDescription>
              Detailed information about the supplier application
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Business Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Business Name</p>
                    <p className="font-medium">
                      {selectedSupplier.business_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p>{selectedSupplier.business_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p>{selectedSupplier.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">
                      {selectedSupplier.contact_person}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{selectedSupplier.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{selectedSupplier.phone}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                {selectedSupplier.document_urls?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSupplier.document_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border rounded-md hover:bg-gray-50">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="text-blue-600 truncate">
                          Document {index + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No documents provided</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <div className="space-x-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDetailsModal(false);
                  openRejectModal(selectedSupplier!);
                }}>
                Reject
              </Button>
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  openApproveModal(selectedSupplier!);
                }}>
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Supplier Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Supplier</DialogTitle>
            <DialogDescription>
              Approve {selectedSupplier?.business_name} as a supplier?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <Textarea
              placeholder="Add any notes about this supplier"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button onClick={approveSupplier} disabled={processingAction}>
              {processingAction ? 'Processing...' : 'Approve Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Supplier Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this supplier application?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Reason for Rejection
            </label>
            <Textarea
              placeholder="Provide a reason for rejection"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectSupplier}
              disabled={processingAction || !notes.trim()}>
              {processingAction ? 'Processing...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
