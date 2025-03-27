'use client';

import { useState } from 'react';
import { SupplierOffer } from '@/types/inventory.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  LayoutList,
  MoreVertical,
  Pencil,
  Trash2,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

interface SupplierOfferListProps {
  offers: SupplierOffer[];
  onEdit: (offer: SupplierOffer) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function SupplierOfferList({
  offers,
  onEdit,
  onDelete,
  isLoading
}: SupplierOfferListProps) {
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {offers.map(offer => (
        <Card key={offer.id} className="hover:shadow-lg transition-shadow">
          {offer.image_url && (
            <div className="relative aspect-video w-full">
              <Image
                fill
                src={offer.image_url}
                alt={offer.material_name}
                className="object-cover rounded-t-lg"
              />
            </div>
          )}
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{offer.material_name}</CardTitle>
                <CardDescription>{offer.category}</CardDescription>
              </div>
              <Badge className={getStatusColor(offer.status)}>
                {offer.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {offer.quantity} {offer.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {offer.price_per_unit} {offer.currency}/unit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {formatDate(offer.availability_date)}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(offer)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(offer.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Available</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map(offer => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">
                {offer.material_name}
              </TableCell>
              <TableCell>{offer.category}</TableCell>
              <TableCell>
                {offer.quantity} {offer.unit}
              </TableCell>
              <TableCell>
                {offer.price_per_unit} {offer.currency}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(offer.status)}>
                  {offer.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(offer.availability_date)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(offer)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(offer.id)}
                      className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant={viewType === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('grid')}>
          <LayoutGrid className="h-4 w-4 mr-1" />
          Grid
        </Button>
        <Button
          variant={viewType === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('table')}>
          <LayoutList className="h-4 w-4 mr-1" />
          Table
        </Button>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Package className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500">No offers available</p>
          </CardContent>
        </Card>
      ) : viewType === 'grid' ? (
        <GridView />
      ) : (
        <TableView />
      )}
    </div>
  );
}
