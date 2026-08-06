import { ORDER_STATUS_META } from '@/lib/constants';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export function StatusBadge({
  status,
  short = false,
  className,
}: {
  status: OrderStatus;
  short?: boolean;
  className?: string;
}) {
  const meta = ORDER_STATUS_META[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
      {short ? meta.short : meta.label}
    </span>
  );
}
