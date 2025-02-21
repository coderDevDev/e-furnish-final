'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryTrends({ itemId }: { itemId: number }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await fetch('/api/inventory/history');
      const data = await response.json();
      setHistory(data);
    };
    fetchHistory();
  }, [itemId]);

  const chartData = {
    labels: history.map(h => new Date(h.recorded_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Quantity',
        data: history.map(h => h.quantity),
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1
      }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Line data={chartData} />
      </CardContent>
    </Card>
  );
}
