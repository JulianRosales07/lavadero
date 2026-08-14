'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RANGE_PRESETS } from '@/lib/constants';
import type { RangePreset } from '@/lib/types';

export interface RangeValue {
  preset: RangePreset;
  from?: string;
  to?: string;
}

export function RangeFilter({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
      <Tabs
        value={value.preset}
        onValueChange={(preset) => onChange({ ...value, preset: preset as RangePreset })}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full grid-cols-4 h-9 p-0.5 sm:inline-flex sm:w-auto sm:h-10 sm:p-1">
          {RANGE_PRESETS.map((preset) => (
            <TabsTrigger
              key={preset.value}
              value={preset.value}
              className="px-1 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-sm font-medium truncate"
            >
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {value.preset === 'custom' ? (
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="range-from" className="text-xs">
              Desde
            </Label>
            <Input
              id="range-from"
              type="date"
              className="h-9 sm:h-10 w-full sm:w-[150px] text-xs sm:text-sm"
              value={value.from ?? ''}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="range-to" className="text-xs">
              Hasta
            </Label>
            <Input
              id="range-to"
              type="date"
              className="h-9 sm:h-10 w-full sm:w-[150px] text-xs sm:text-sm"
              value={value.to ?? ''}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
