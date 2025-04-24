'use client';

import OrderHistory from '@/components/admin/suppliers/OrderHistory';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

type OrderHistoryCardProps = {
  supplierId: string;
};

export default function OrderHistoryCard({
  supplierId
}: OrderHistoryCardProps) {
  return <OrderHistory supplierId={supplierId} />;
}
