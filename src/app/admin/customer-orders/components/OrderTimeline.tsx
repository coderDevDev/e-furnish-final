import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  Package,
  Truck,
  XCircle
} from 'lucide-react';

const TIMELINE_STEPS = [
  { status: 'pending', icon: Clock, label: 'Order Pending' },
  { status: 'processing', icon: Package, label: 'Processing' },
  { status: 'shipped', icon: Truck, label: 'Shipped' },
  { status: 'delivered', icon: CheckCircle2, label: 'Delivered' }
];

interface OrderTimelineProps {
  status: string;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const currentStepIndex = TIMELINE_STEPS.findIndex(
    step => step.status === status
  );

  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center py-4">
        <XCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 font-medium text-red-500">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex justify-between">
      {TIMELINE_STEPS.map((step, index) => {
        const isComplete = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div
            key={step.status}
            className={cn('flex flex-col items-center space-y-2', {
              'text-primary': isComplete,
              'text-gray-400': !isComplete
            })}>
            <step.icon
              className={cn('h-6 w-6', {
                'text-primary': isComplete,
                'text-gray-400': !isComplete,
                'animate-pulse': isCurrent
              })}
            />
            <span className="text-xs">{step.label}</span>
            {index < TIMELINE_STEPS.length - 1 && (
              <div
                className={cn('h-0.5 w-12 -translate-y-4', {
                  'bg-primary': index < currentStepIndex,
                  'bg-gray-200': index >= currentStepIndex
                })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
