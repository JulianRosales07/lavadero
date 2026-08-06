import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TONES = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

export type StatTone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  loading = false,
  className,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const interactive = typeof onClick === 'function';

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        interactive && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lifted',
        className,
      )}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', TONES[tone])}>
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
    </Card>
  );
}
