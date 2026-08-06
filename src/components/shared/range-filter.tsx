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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Tabs
        value={value.preset}
        onValueChange={(preset) => onChange({ ...value, preset: preset as RangePreset })}
      >
        <TabsList>
          {RANGE_PRESETS.map((preset) => (
            <TabsTrigger key={preset.value} value={preset.value}>
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {value.preset === 'custom' ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="range-from" className="text-xs">
              Desde
            </Label>
            <Input
              id="range-from"
              type="date"
              className="h-10 w-[150px]"
              value={value.from ?? ''}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="range-to" className="text-xs">
              Hasta
            </Label>
            <Input
              id="range-to"
              type="date"
              className="h-10 w-[150px]"
              value={value.to ?? ''}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
