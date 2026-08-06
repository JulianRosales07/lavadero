'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money } from '@/lib/format';

/**
 * Gráficas de los reportes, aisladas en su propio módulo.
 * Recharts pesa bastante, así que la página lo carga de forma diferida.
 */

export const CHART_COLORS = ['#0284c7', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

const axisProps = {
  tick: { fontSize: 12 },
  stroke: 'currentColor',
  className: 'text-muted-foreground',
} as const;

const tooltipStyle = { borderRadius: 12, fontSize: 12 } as const;

export function SalesTrendChart({
  data,
}: {
  data: { label: string; ventas: number; propinas: number }[];
}) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <ChartTooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name) => [money(value), name]}
          />
          <Line
            type="monotone"
            dataKey="ventas"
            name="Ventas"
            stroke={CHART_COLORS[0]}
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="propinas"
            name="Propinas"
            stroke={CHART_COLORS[3]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopServicesChart({ data }: { data: { name: string; cantidad: number }[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
            {...axisProps}
            tick={{ fontSize: 11 }}
          />
          <YAxis {...axisProps} />
          <ChartTooltip contentStyle={tooltipStyle} />
          <Bar dataKey="cantidad" name="Cantidad" radius={[6, 6, 0, 0]} fill={CHART_COLORS[0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentMethodsChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name) => [money(value), name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
