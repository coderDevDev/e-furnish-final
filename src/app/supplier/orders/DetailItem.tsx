interface DetailItemProps {
  label: string;
  value: string;
}

export default function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </div>
  );
}
