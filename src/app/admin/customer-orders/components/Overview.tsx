'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { customerOrderService } from '@/lib/services/customerOrderService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function Overview() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const analyticsData = await customerOrderService.getOrderAnalytics(
        'month'
      );
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const chartData = {
    labels: data.map(item =>
      new Date(item.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    ),
    datasets: [
      {
        label: 'Orders',
        data: data.map(item => item.total_amount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `₱${value.toLocaleString()}`
        }
      }
    }
  };

  return (
    <div className="h-[350px]">
      <Bar options={options} data={chartData} />
    </div>
  );
}
