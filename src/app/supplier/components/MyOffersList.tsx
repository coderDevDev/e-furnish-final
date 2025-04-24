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

type Offer = {
  id: string;
  title: string;
  price: number;
  discount_percentage?: number;
  min_order_quantity: number;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  image_url?: string;
};

export default function MyOffersList() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const supabase = createClientComponentClient();

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

  const fetchOffers = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get supplier ID
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) return;

      // Get offers for this supplier
      const { data, error } = await supabase
        .from('supplier_offers')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data as Offer[]);
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

  const filteredOffers = offers.filter(
    offer =>
      offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
              {getStatusBadge(offer.status)}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Price: ₱{offer.price.toFixed(2)}</p>
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

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle>Manage Your Offers</CardTitle>
        <CardDescription>
          Create, edit, and manage all your product offers
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              {offers.length === 0 ? (
                <>
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
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No offers match your search.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile view (cards) */}
              <div className="md:hidden space-y-3">
                {filteredOffers.map(offer => (
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
                    {filteredOffers.map(offer => (
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
                        <TableCell>₱{offer.price.toFixed(2)}</TableCell>
                        <TableCell>{offer.category}</TableCell>
                        <TableCell>{offer.min_order_quantity}</TableCell>
                        <TableCell>{getStatusBadge(offer.status)}</TableCell>
                        <TableCell>
                          {format(new Date(offer.created_at), 'MMM d, yyyy')}
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
                This action cannot be undone. This will permanently delete the
                offer and remove it from our servers.
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
      </CardContent>
    </Card>
  );
}
