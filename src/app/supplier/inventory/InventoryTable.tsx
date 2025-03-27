'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { InventoryItem } from '@/types/inventory.types';

interface InventoryTableProps {
  inventory: InventoryItem[];
}

export default function InventoryTable({ inventory }: InventoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{/* Add action buttons for edit/delete */}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
