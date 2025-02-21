'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface HistoryEntry {
  id: number;
  quantity: number;
  previous_quantity: number;
  change_type: 'update' | 'order' | 'adjustment';
  notes: string;
  recorded_at: string;
  name: string;
  category: string;
}

export default function InventoryHistory({ itemId }: { itemId: number }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await fetch(`/api/inventory/${itemId}/history`);
      const data = await response.json();
      setHistory(data);
    };
    fetchHistory();
  }, [itemId]);

  const getChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Inventory History</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map(entry => (
            <TableRow key={entry.id}>
              <TableCell>
                {format(new Date(entry.recorded_at), 'MMM d, yyyy HH:mm')}
              </TableCell>
              <TableCell
                className={getChangeColor(
                  entry.quantity,
                  entry.previous_quantity
                )}>
                {entry.previous_quantity} → {entry.quantity}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    entry.change_type === 'update' ? 'default' : 'secondary'
                  }>
                  {entry.change_type}
                </Badge>
              </TableCell>
              <TableCell>{entry.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
