'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { getCurrencySign, parseMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Importe en pesos enteros */
  value: number;
  /** Nuevo importe en pesos enteros */
  onValueChange: (amount: number) => void;
  sign?: string;
}

const LOCALE = 'es-CO';

/** Muestra el importe con separador de miles: 25000 -> "25.000" */
const display = (amount: number) => (amount ? amount.toLocaleString(LOCALE) : '');

/**
 * Input monetario en pesos colombianos.
 * Acepta solo dígitos y formatea los miles mientras se escribe; el valor que
 * entrega siempre es un entero de pesos, sin decimales.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, className, sign, ...props }, ref) => {
    const [text, setText] = React.useState(() => display(value));

    // Sincroniza cuando el valor cambia desde fuera (ej. recálculo de totales).
    React.useEffect(() => {
      if (parseMoney(text) !== value) setText(display(value));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
          {sign ?? getCurrencySign()}
        </span>
        <Input
          ref={ref}
          inputMode="numeric"
          className={cn('pl-9 font-medium tabular-nums', className)}
          value={text}
          placeholder="0"
          onChange={(event) => {
            const amount = parseMoney(event.target.value);
            setText(display(amount));
            onValueChange(amount);
          }}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = 'MoneyInput';
