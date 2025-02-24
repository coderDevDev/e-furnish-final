'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { OrderStats } from '@/lib/services/customerOrderService';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OrderStatusChartProps {
  stats: OrderStats | null;
}

export function OrderStatusChart({ stats }: OrderStatusChartProps) {
  if (!stats) return null;

  const data = {
    labels: ['Pending', 'Processing', 'Completed', 'Cancelled', 'Returned'],
    datasets: [
      {
        data: [
          stats.pending,
          stats.processing,
          stats.completed,
          stats.cancelled,
          stats.returned
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.5)', // Pending - Yellow
          'rgba(54, 162, 235, 0.5)', // Processing - Blue
          'rgba(75, 192, 192, 0.5)', // Completed - Green
          'rgba(255, 99, 132, 0.5)', // Cancelled - Red
          'rgba(153, 102, 255, 0.5)' // Returned - Purple
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const
      }
    }
  };

  return <Pie data={data} options={options} />;
}
