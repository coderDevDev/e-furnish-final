'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import {
  Loader2,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MdInventory2 } from 'react-icons/md';
import {
  AlertCircle,
  PackageCheck,
  AlertTriangle,
  Package
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type Offer = {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  min_order_quantity: number;
  description: string;
  category: string;
  status:
    | 'active'
    | 'inactive'
    | 'draft'
    | 'in_stock'
    | 'low_stock'
    | 'out_of_stock';
  created_at: string;
  updated_at: string;
  image_url?: string;
  supplier_id: string;
};

export default function MyOffersList() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddInventoryDialog, setShowAddInventoryDialog] = useState(false);
  const [currentInventoryItem, setCurrentInventoryItem] =
    useState<Offer | null>(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchSupplierId = async () => {
      try {
        // Get the current authenticated user
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get the supplier record for this user
        const { data, error } = await supabase
          .from('suppliers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.id) {
          setSupplierId(data.id);
        }
      } catch (error) {
        console.error('Error fetching supplier ID:', error);
      }
    };

    fetchSupplierId();
  }, []);

  useEffect(() => {
    fetchOffers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('supplier-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_offers'
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (supplierId) {
      fetchInventoryItems();
    }
  }, [supplierId]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) return;

      const { data, error } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data as Offer[]);
      setFilteredOffers(data as Offer[]);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async () => {
    if (!offerToDelete) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('supplier_offers')
        .delete()
        .eq('id', offerToDelete);

      if (error) throw error;

      // Update local state
      setOffers(offers.filter(offer => offer.id !== offerToDelete));
      toast.success('Offer deleted successfully');
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    } finally {
      setDeleting(false);
      setOfferToDelete(null);
    }
  };

  const fetchInventoryItems = async () => {
    if (!supplierId) return;

    try {
      setInventoryLoading(true);

      // Fetch inventory items for this supplier
      const { data, error } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('title', { ascending: true });

      if (error) throw error;

      if (data) {
        // Calculate status for each item
        const processedData = data.map(item => ({
          ...item,
          status: getStockStatus(item.stock_quantity, item.min_order_quantity)
        }));

        setOffers(processedData);
        setFilteredOffers(processedData);

        // Update stats
        setInventoryStats({
          totalItems: processedData.length,
          lowStockItems: processedData.filter(
            item => item.status === 'low_stock'
          ).length,
          outOfStockItems: processedData.filter(
            item => item.status === 'out_of_stock'
          ).length
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setInventoryLoading(false);
    }
  };

  const getStockStatus = (
    current: number,
    minimum: number
  ): Offer['status'] => {
    if (current <= 0) return 'out_of_stock';
    if (current <= minimum) return 'low_stock';
    return 'in_stock';
  };

  const applyInventoryFilters = () => {
    let filtered = [...offers];

    if (inventorySearchQuery) {
      filtered = filtered.filter(
        item =>
          item.title
            .toLowerCase()
            .includes(inventorySearchQuery.toLowerCase()) ||
          item.description
            ?.toLowerCase()
            .includes(inventorySearchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredOffers(filtered);
  };

  const getStatusBadge = (offer: Offer) => {
    // First check stock status
    if (offer.stock_quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (offer.stock_quantity <= offer.min_order_quantity) {
      return <Badge variant="warning">Low Stock</Badge>;
    }

    // If stock is good, show the offer status
    switch (offer.status) {
      case 'active':
        return <Badge variant="success">In Stock</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{offer.status}</Badge>;
    }
  };

  // Mobile card view for offers
  const MobileOfferCard = ({ offer }: { offer: Offer }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {offer.image_url && (
            <Image
              src={offer.image_url}
              alt={offer.title}
              width={80}
              height={80}
              className="rounded-md object-cover"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium">{offer.title}</h3>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              <Badge variant="outline" className="text-xs">
                {offer.category}
              </Badge>
              {getStatusBadge(offer)}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                Price: ₱
                {offer.price.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p>Min. Order: {offer.min_order_quantity}</p>
              <p className="text-xs">
                Created: {format(new Date(offer.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/supplier/offers/${offer.id}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setOfferToDelete(offer.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleStockAdjustment = async (id: string, newQuantity: number) => {
    try {
      if (newQuantity < 0) {
        toast.error('Stock quantity cannot be negative');
        return;
      }

      const { error } = await supabase
        .from('supplier_offers')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setOffers(prev =>
        prev.map(offer =>
          offer.id === id
            ? {
                ...offer,
                stock_quantity: newQuantity,
                status: getStockStatus(newQuantity, offer.min_order_quantity)
              }
            : offer
        )
      );

      setFilteredOffers(prev =>
        prev.map(offer =>
          offer.id === id
            ? {
                ...offer,
                stock_quantity: newQuantity,
                status: getStockStatus(newQuantity, offer.min_order_quantity)
              }
            : offer
        )
      );

      toast.success('Stock quantity updated');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock quantity');
    }
  };

  const handleAddInventoryItem = async (formData: any) => {
    if (!supplierId) return;

    try {
      const newItem = {
        supplier_id: supplierId,
        title: formData.title,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_order_quantity: parseInt(formData.min_order_quantity) || 5,
        description: formData.description || null,
        category: formData.category,
        status: getStockStatus(
          parseInt(formData.stock_quantity),
          parseInt(formData.min_order_quantity)
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: formData.image_url || null
      };

      const { data, error } = await supabase
        .from('supplier_offers')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Update the inventory items
        setOffers(prev => [...prev, data]);
        setFilteredOffers(prev => [...prev, data]);

        // Update stats
        setInventoryStats(prev => ({
          totalItems: prev.totalItems + 1,
          lowStockItems:
            data.status === 'low_stock'
              ? prev.lowStockItems + 1
              : prev.lowStockItems,
          outOfStockItems:
            data.status === 'out_of_stock'
              ? prev.outOfStockItems + 1
              : prev.outOfStockItems
        }));

        toast.success('Inventory item added successfully');
        setShowAddInventoryDialog(false);
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Failed to add inventory item');
    }
  };

  const handleEditOffer = (offer: Offer) => {
    // Implement the logic to edit the offer
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase
        .from('supplier_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Offer deleted successfully');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const handleStockInputChange = (id: string, value: string) => {
    setStockInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleStockInputBlur = async (id: string) => {
    const newQuantity = parseInt(stockInputs[id]);
    if (isNaN(newQuantity)) {
      toast.error('Please enter a valid number');
      return;
    }

    if (newQuantity < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    await handleStockAdjustment(id, newQuantity);
    // Clear the input state for this item
    setStockInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[id];
      return newInputs;
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Manage Your Offers</CardTitle>
        <CardDescription>
          Create, edit, and manage all your product offers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="offers">My Offers</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          </TabsList>

          <TabsContent value="offers">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search offers..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button asChild className="whitespace-nowrap">
                  <Link href="/supplier/offers/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Offer
                  </Link>
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    You haven't created any offers yet.
                  </p>
                  <Button asChild>
                    <Link href="/supplier/offers/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Offer
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile view (cards) */}
                  <div className="md:hidden space-y-3">
                    {offers.map(offer => (
                      <MobileOfferCard key={offer.id} offer={offer} />
                    ))}
                  </div>

                  {/* Desktop view (table) */}
                  <div className="hidden md:block border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Min. Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offers.map(offer => (
                          <TableRow key={offer.id}>
                            <TableCell>
                              {offer.image_url ? (
                                <Image
                                  src={offer.image_url}
                                  alt={offer.title}
                                  width={80}
                                  height={80}
                                  className="rounded-md object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                  No img
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {offer.title}
                            </TableCell>
                            <TableCell>
                              ₱
                              {offer.price.toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell>{offer.category}</TableCell>
                            <TableCell>{offer.min_order_quantity}</TableCell>
                            <TableCell>{getStatusBadge(offer)}</TableCell>
                            <TableCell>
                              {format(
                                new Date(offer.created_at),
                                'MMM d, yyyy'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/supplier/offers/${offer.id}/edit`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Offer
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => setOfferToDelete(offer.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Offer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>

            <AlertDialog
              open={!!offerToDelete}
              onOpenChange={() => setOfferToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the offer and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteOffer}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="inventory">
            {inventoryLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <PackageCheck className="h-5 w-5 text-primary mr-2" />
                        <span className="text-2xl font-bold">
                          {inventoryStats.totalItems}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Low Stock Itemsss
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                        <span className="text-2xl font-bold">
                          {inventoryStats.lowStockItems}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Out of Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-2xl font-bold">
                          {inventoryStats.outOfStockItems}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search items..."
                        className="pl-10"
                        value={inventorySearchQuery}
                        onChange={e => {
                          setInventorySearchQuery(e.target.value);
                          applyInventoryFilters();
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={categoryFilter}
                        onValueChange={value => {
                          setCategoryFilter(value);
                          applyInventoryFilters();
                        }}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="wood">Wood</SelectItem>
                          <SelectItem value="metal">Metal</SelectItem>
                          <SelectItem value="fabric">Fabric</SelectItem>
                          <SelectItem value="plastic">Plastic</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={statusFilter}
                        onValueChange={value => {
                          setStatusFilter(value);
                          applyInventoryFilters();
                        }}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">
                            Out of Stock
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setCurrentInventoryItem(null);
                      setShowAddInventoryDialog(true);
                    }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {filteredOffers.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stock Level</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOffers.map(offer => (
                          <TableRow key={offer.id}>
                            <TableCell className="font-medium">
                              {offer.title}
                            </TableCell>
                            <TableCell>{offer.category}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={
                                    stockInputs[offer.id] ??
                                    offer.stock_quantity.toString()
                                  }
                                  onChange={e => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                      handleStockInputChange(offer.id, value);
                                    }
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleStockInputBlur(offer.id);
                                    }
                                  }}
                                  onBlur={() => handleStockInputBlur(offer.id)}
                                  className="w-20 h-8"
                                  min="0"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleStockAdjustment(
                                      offer.id,
                                      offer.stock_quantity - 1
                                    )
                                  }
                                  disabled={offer.stock_quantity <= 0}>
                                  -
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleStockAdjustment(
                                      offer.id,
                                      offer.stock_quantity + 1
                                    )
                                  }>
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(offer)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOffer(offer.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p>No inventory items found</p>
                    <p className="text-sm">
                      Add your first inventory item to get started
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setCurrentInventoryItem(null);
                        setShowAddInventoryDialog(true);
                      }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog
          open={showAddInventoryDialog}
          onOpenChange={setShowAddInventoryDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {currentInventoryItem
                  ? 'Edit Inventory Item'
                  : 'Add New Inventory Item'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {currentInventoryItem
                  ? 'Update the details of your inventory item'
                  : 'Add a new item to your inventory'}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid gap-4 py-4">
              <p className="text-center text-muted-foreground">
                Inventory form implementation coming soon!
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>
                {currentInventoryItem ? 'Save Changes' : 'Add Item'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
