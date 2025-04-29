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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  PackageCheck,
  AlertCircle,
  AlertTriangle,
  Package,
  BarChart4
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type OfferItem = {
  id: string;
  title: string;
  price: number;
  stock_quantity: number; // For inventory tracking
  min_order_quantity: number; // Can be used as minimum stock threshold
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  image_url?: string;
  supplier_id: string;
};

export default function InventoryManagement() {
  const [inventoryItems, setInventoryItems] = useState<OfferItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<OfferItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

  // Add this state to handle input values
  const [stockInputs, setStockInputs] = useState<{ [key: string]: string }>({});

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inventoryItems, searchQuery, categoryFilter, statusFilter]);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);

      // Get current user's supplier ID
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

      // Fetch offers for this supplier
      const { data, error } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .order('title', { ascending: true });

      if (error) throw error;

      if (data) {
        setInventoryItems(data);
        setFilteredItems(data);

        // Update stats
        const stats = {
          totalItems: data.length,
          lowStockItems: data.filter(
            item => item.stock_quantity <= item.min_order_quantity
          ).length,
          outOfStockItems: data.filter(item => item.stock_quantity <= 0).length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inventoryItems];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredItems(filtered);
  };

  const handleAddNewItem = () => {
    setCurrentItem(null);
    setShowAddEditDialog(true);
  };

  const handleEditItem = (item: OfferItem) => {
    setCurrentItem(item);
    setShowAddEditDialog(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?'))
      return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('supplier_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Inventory item deleted successfully');
      fetchInventoryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete inventory item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjustment = async (id: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('supplier_offers')
        .update({
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Stock quantity updated');
      fetchInventoryItems();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock quantity');
    }
  };

  // Get stock status based on quantities
  const getStockStatus = (item: OfferItem) => {
    if (item.stock_quantity <= 0) return 'out_of_stock';
    if (item.stock_quantity <= item.min_order_quantity) return 'low_stock';
    return 'in_stock';
  };

  // Render the stock status badge
  const StockStatusBadge = ({ item }: { item: OfferItem }) => {
    const status = getStockStatus(item);
    return (
      <Badge
        variant={
          status === 'in_stock'
            ? 'success'
            : status === 'low_stock'
            ? 'warning'
            : 'destructive'
        }>
        {status === 'in_stock'
          ? 'In Stock'
          : status === 'low_stock'
          ? 'Low Stock'
          : 'Out of Stock'}
      </Badge>
    );
  };

  // Add this function to handle input changes
  const handleStockInputChange = (id: string, value: string) => {
    setStockInputs(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Add this function to handle input blur (when user finishes editing)
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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{stats.totalItems}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">{stats.lowStockItems}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-2xl font-bold">
                {stats.outOfStockItems}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Management */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Manage your product inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="wood">Wood</SelectItem>
                <SelectItem value="metal">Metal</SelectItem>
                <SelectItem value="fabric">Fabric</SelectItem>
                <SelectItem value="plastic">Plastic</SelectItem>
                <SelectItem value="glass">Glass</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddNewItem} className="sm:w-auto w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Inventory Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    {/* <TableHead className="text-right">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              ₱{item.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {console.log({ stockInputs })}

                          {stockInputs.hasOwnProperty(item.id) ? (
                            <Input
                              type="number"
                              value={stockInputs[item.id]}
                              onChange={e =>
                                handleStockInputChange(item.id, e.target.value)
                              }
                              onBlur={() => handleStockInputBlur(item.id)}
                              className="w-20 h-8"
                              min="0"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span
                                className="cursor-pointer hover:text-primary"
                                onClick={() =>
                                  setStockInputs(prev => ({
                                    ...prev,
                                    [item.id]: item.stock_quantity.toString()
                                  }))
                                }>
                                {item.stock_quantity} units
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStockAdjustment(
                                    item.id,
                                    item.stock_quantity - 1
                                  )
                                }
                                disabled={item.stock_quantity <= 0}>
                                -
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStockAdjustment(
                                    item.id,
                                    item.stock_quantity + 1
                                  )
                                }>
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StockStatusBadge item={item} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}>
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
              {searchQuery ||
              categoryFilter !== 'all' ||
              statusFilter !== 'all' ? (
                <div>
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p>No items match your search criteria</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div>
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p>No inventory items found</p>
                  <p className="text-sm">
                    Add your first inventory item to get started
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddNewItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              {currentItem
                ? 'Update the details of your inventory item'
                : 'Add a new item to your inventory'}
            </DialogDescription>
          </DialogHeader>

          {/* Form will be implemented in the next iteration */}
          <div className="grid gap-4 py-4">
            <p className="text-center text-muted-foreground">
              Form implementation coming soon!
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddEditDialog(false)}>
              Cancel
            </Button>
            <Button disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {currentItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
