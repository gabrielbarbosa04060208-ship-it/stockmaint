import { cn } from '@/lib/utils';

type Props = { qty: number; minQty: number; className?: string };

export function StockBar({ qty, minQty, className }: Props) {
  const pct = minQty > 0 ? Math.min((qty / (minQty * 2)) * 100, 100) : (qty > 0 ? 100 : 0);
  const color = qty === 0 ? 'bg-destructive' : qty <= minQty ? 'bg-warning' : 'bg-success';

  return (
    <div className={cn("w-full h-2 rounded-full bg-secondary", className)}>
      <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
