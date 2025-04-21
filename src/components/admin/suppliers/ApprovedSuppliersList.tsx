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
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { Search, ShoppingCart, Truck, Package, Store } from 'lucide-react';
import SupplierOffersPanel from './SupplierOffersPanel';
import PlaceOrderModal from './PlaceOrderModal';
import OrderHistory from './OrderHistory';

type Supplier = {
  id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  business_type: string;
  approved_at: string;
  status: 'approved';
};

export default function ApprovedSuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showOffersPanel, setShowOffersPanel] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeTab, setActiveTab] = useState('offers');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'approved')
      .order('business_name', { ascending: true });

    if (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    } else {
      setSuppliers(data as Supplier[]);
    }
    setLoading(false);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchString =
      `${supplier.business_name} ${supplier.contact_person} ${supplier.business_type}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const viewSupplierOffers = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowOffersPanel(true);
  };

  const openOrderModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowOrderModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search suppliers..."
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
          No approved suppliers found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Approved On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Store className="h-4 w-4 mr-2 text-gray-400" />
                      {supplier.business_name}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.business_type}</TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>
                    {format(new Date(supplier.approved_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => viewSupplierOffers(supplier)}>
                        <Package className="h-4 w-4" />
                        <span>View Offers</span>
                      </Button>
                      <Button
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => openOrderModal(supplier)}>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Place Order</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Supplier Offers Panel */}
      <Dialog open={showOffersPanel} onOpenChange={setShowOffersPanel}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier?.business_name} - Available Offers
            </DialogTitle>
          </DialogHeader>

          {selectedSupplier && (
            <SupplierOffersPanel
              supplierId={selectedSupplier.id}
              onOrderPlace={() => {
                setShowOffersPanel(false);
                openOrderModal(selectedSupplier);
              }}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOffersPanel(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Place Order Modal */}
      {selectedSupplier && (
        <PlaceOrderModal
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
          supplier={selectedSupplier}
          onOrderSuccess={() => {
            setShowOrderModal(false);
            toast.success('Order placed successfully');
          }}
        />
      )}

      {activeTab === 'orders' && selectedSupplier && (
        <OrderHistory supplierId={selectedSupplier.id} />
      )}
    </div>
  );
}
