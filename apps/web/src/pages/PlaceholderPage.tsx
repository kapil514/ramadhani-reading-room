import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Construction className="h-12 w-12 text-gray-300 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">Coming soon — this module is being built.</p>
    </div>
  );
}
