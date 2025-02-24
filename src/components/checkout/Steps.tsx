import { cn } from '@/lib/utils';

interface StepsProps {
  currentStep: number;
}

export function Steps({ currentStep }: StepsProps) {
  const steps = [
    { number: 1, title: 'Shipping' },
    { number: 2, title: 'Payment' },
    { number: 3, title: 'Review' }
  ];

  return (
    <div className="flex justify-center items-center space-x-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2',
              currentStep >= step.number
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 text-gray-500'
            )}>
            {step.number}
          </div>
          <span
            className={cn(
              'ml-2',
              currentStep >= step.number
                ? 'text-primary font-medium'
                : 'text-gray-500'
            )}>
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-16 h-0.5 mx-2',
                currentStep > step.number ? 'bg-primary' : 'bg-gray-300'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
