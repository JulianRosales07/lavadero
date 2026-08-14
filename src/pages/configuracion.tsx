'use client';

import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Camera, FileText, KeyRound, Loader2, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useBusiness, useSaveBusiness } from '@/hooks/use-catalog';
import { useFactusNumberingRanges } from '@/hooks/use-electronic-invoices';
import { useUpload } from '@/hooks/use-upload';
import { api, ApiError } from '@/lib/api';
import { USER_ROLE_META } from '@/lib/constants';
import type { Business } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();
  const isOperator = user?.role === 'OPERATOR';

  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab =
    requestedTab === 'ticket' || requestedTab === 'factus' || requestedTab === 'seguridad'
      ? requestedTab
      : 'negocio';

  // Los empleados solo pueden gestionar su propio perfil
  if (isOperator) {
    return (
      <>
        <PageHeader
          title="Mi perfil"
          description="Datos de tu cuenta y cambio de contraseña."
        />
        <SecurityTab />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos del negocio, formato del ticket y seguridad de tu cuenta."
      />

      <Tabs defaultValue={initialTab}>
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:w-auto h-auto flex-nowrap sm:flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="negocio" className="text-xs sm:text-sm">
              <Building2 className="size-4" />
              Negocio
            </TabsTrigger>
            <TabsTrigger value="ticket" className="text-xs sm:text-sm">
              <Printer className="size-4" />
              Ticket
            </TabsTrigger>
            <TabsTrigger value="factus" className="text-xs sm:text-sm">
              <FileText className="size-4" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="text-xs sm:text-sm">
              <KeyRound className="size-4" />
              Seguridad
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="negocio">
          <BusinessTab />
        </TabsContent>
        <TabsContent value="ticket">
          <TicketTab />
        </TabsContent>
        <TabsContent value="factus">
          <FactusTab />
        </TabsContent>
        <TabsContent value="seguridad">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ---------------------------------------------------------------------
// Datos del negocio
// ---------------------------------------------------------------------

function BusinessTab() {
  const { data: business, isLoading } = useBusiness();
  const saveBusiness = useSaveBusiness();
  const { uploading, uploadOne } = useUpload('logos');

  const [form, setForm] = React.useState<Partial<Business>>({});

  React.useEffect(() => {
    if (business) setForm(business);
  }, [business]);

  const set = (patch: Partial<Business>) => setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || form.name.trim().length < 2) {
      toast.error('Escribe el nombre del negocio');
      return;
    }

    await saveBusiness.mutateAsync({
      name: form.name.trim(),
      legalName: form.legalName?.trim() || null,
      taxId: form.taxId?.trim() || null,
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      logoUrl: form.logoUrl || null,
      currencySign: form.currencySign?.trim() || 'S/',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del negocio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Logo */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const uploaded = await uploadOne(file);
                if (uploaded) set({ logoUrl: uploaded.url });
                event.target.value = '';
              }}
            />
            <label
              htmlFor="logo-input"
              className={cn(
                'relative grid size-24 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary',
                form.logoUrl && 'border-solid bg-white',
              )}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo del negocio"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="flex flex-col items-center gap-1">
                  <Camera className="size-5" aria-hidden />
                  <span className="text-[10px] font-medium">Logo</span>
                </span>
              )}
            </label>

            <div className="space-y-1">
              <p className="text-sm font-medium">Logo del negocio</p>
              <p className="text-xs text-muted-foreground">
                Se imprime en la parte superior del ticket. PNG con fondo transparente funciona
                mejor.
              </p>
              {form.logoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => set({ logoUrl: null })}
                >
                  <Trash2 />
                  Quitar logo
                </Button>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nombre comercial *</Label>
              <Input
                id="business-name"
                value={form.name ?? ''}
                onChange={(event) => set({ name: event.target.value })}
                placeholder="Lavadero Express"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-legal">Razón social</Label>
              <Input
                id="business-legal"
                value={form.legalName ?? ''}
                onChange={(event) => set({ legalName: event.target.value })}
                placeholder="Lavadero Express S.A.C."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-tax">RUC / NIT</Label>
              <Input
                id="business-tax"
                value={form.taxId ?? ''}
                onChange={(event) => set({ taxId: event.target.value })}
                placeholder="20123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-phone">Teléfono</Label>
              <Input
                id="business-phone"
                value={form.phone ?? ''}
                onChange={(event) => set({ phone: event.target.value })}
                placeholder="(01) 555-0100"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business-address">Dirección</Label>
              <Input
                id="business-address"
                value={form.address ?? ''}
                onChange={(event) => set({ address: event.target.value })}
                placeholder="Av. Principal 123, Lima"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-currency">Signo de moneda</Label>
              <Input
                id="business-currency"
                value={form.currencySign ?? ''}
                onChange={(event) => set({ currencySign: event.target.value })}
                placeholder="S/"
                className="max-w-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Se usa en toda la plataforma y en el ticket.
              </p>
            </div>
          </div>

          <Button type="submit" loading={saveBusiness.isPending}>
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------

function TicketTab() {
  const { data: business } = useBusiness();
  const saveBusiness = useSaveBusiness();

  const [width, setWidth] = React.useState<'58mm' | '80mm'>('80mm');
  const [showQr, setShowQr] = React.useState(true);
  const [footer, setFooter] = React.useState('');

  React.useEffect(() => {
    if (!business) return;
    setWidth(business.ticketWidth);
    setShowQr(business.showQr);
    setFooter(business.ticketFooter ?? '');
  }, [business]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formato del ticket</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Ancho del papel</Label>
          <Tabs value={width} onValueChange={(value) => setWidth(value as '58mm' | '80mm')}>
            <TabsList>
              <TabsTrigger value="58mm">58 mm</TabsTrigger>
              <TabsTrigger value="80mm">80 mm</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Ancho por defecto al imprimir. Puedes cambiarlo en cada ticket.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
          <div>
            <p className="text-sm font-medium">Incluir código QR</p>
            <p className="text-xs text-muted-foreground">
              El cliente puede consultar el detalle de su orden.
            </p>
          </div>
          <Switch checked={showQr} onCheckedChange={setShowQr} aria-label="Incluir código QR" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket-footer">Mensaje al pie</Label>
          <Textarea
            id="ticket-footer"
            value={footer}
            onChange={(event) => setFooter(event.target.value)}
            placeholder="¡Gracias por su preferencia!"
            className="min-h-[70px]"
          />
        </div>

        <Button
          loading={saveBusiness.isPending}
          onClick={() =>
            void saveBusiness.mutateAsync({
              ticketWidth: width,
              showQr,
              ticketFooter: footer.trim() || null,
            })
          }
        >
          Guardar formato
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Facturación electrónica
// ---------------------------------------------------------------------

function FactusTab() {
  const { data: business, isLoading } = useBusiness();
  const {
    data: numberingRanges,
    isLoading: rangesLoading,
    isError: rangesError,
  } = useFactusNumberingRanges();
  const saveBusiness = useSaveBusiness();
  const [form, setForm] = React.useState<Partial<Business>>({});

  React.useEffect(() => {
    if (business) setForm(business);
  }, [business]);

  const set = (patch: Partial<Business>) => setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.factusEnabled && (!form.factusNumberingRangeId || form.factusNumberingRangeId <= 0)) {
      toast.error('Configura un rango de numeración válido antes de habilitar Factus');
      return;
    }
    if (
      form.factusEnabled &&
      !/^\d{5}$/.test(form.factusDefaultMunicipalityCode?.trim() ?? '')
    ) {
      toast.error('Configura el código DANE de 5 dígitos del municipio del lavadero');
      return;
    }

    await saveBusiness.mutateAsync({
      factusEnabled: Boolean(form.factusEnabled),
      factusNumberingRangeId: form.factusNumberingRangeId ?? null,
      factusDocument: form.factusDocument || '01',
      factusOperationType: form.factusOperationType || '10',
      factusSendEmail: Boolean(form.factusSendEmail),
      factusTaxId: form.factusTaxId?.trim() || null,
      factusTaxRate: Number(form.factusTaxRate ?? 0),
      factusDefaultMunicipalityCode: form.factusDefaultMunicipalityCode?.trim() || null,
      factusDefaultLegalOrganizationCode:
        form.factusDefaultLegalOrganizationCode || '2',
      factusDefaultTributeCode: form.factusDefaultTributeCode?.trim() || 'ZZ',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-72 animate-pulse bg-muted/30" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integración con Factus</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">Habilitar facturación electrónica</p>
              <p className="text-xs text-muted-foreground">
                Permite emitir facturas DIAN desde órdenes cobradas.
              </p>
            </div>
            <Switch
              checked={Boolean(form.factusEnabled)}
              onCheckedChange={(checked) => set({ factusEnabled: checked })}
              aria-label="Habilitar Factus"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Las credenciales OAuth de Factus se configuran únicamente en el archivo{' '}
            <code>backend/.env</code>. Nunca se envían al navegador.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rango de numeración *</Label>
              {numberingRanges && numberingRanges.length > 0 ? (
                <Select
                  value={
                    form.factusNumberingRangeId
                      ? String(form.factusNumberingRangeId)
                      : undefined
                  }
                  onValueChange={(value) => set({ factusNumberingRangeId: Number(value) })}
                >
                  <SelectTrigger id="factus-range">
                    <SelectValue placeholder="Selecciona un rango activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {numberingRanges.map((range) => (
                      <SelectItem key={range.id} value={String(range.id)}>
                        {range.prefix} · {range.document} · ID {range.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="factus-range"
                  type="number"
                  min={1}
                  disabled={rangesLoading}
                  value={form.factusNumberingRangeId ?? ''}
                  onChange={(event) =>
                    set({
                      factusNumberingRangeId: event.target.value
                        ? Number(event.target.value)
                        : null,
                    })
                  }
                  placeholder={rangesLoading ? 'Consultando Factus…' : 'ID del rango'}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {rangesError
                  ? 'No se pudieron consultar los rangos; verifica el ID manualmente.'
                  : 'Solo se muestran rangos activos de Factura de Venta.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select
                value={form.factusDocument || '01'}
                onValueChange={(value) => set({ factusDocument: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">01 · Factura de venta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de operación</Label>
              <Select
                value={form.factusOperationType || '10'}
                onValueChange={(value) => set({ factusOperationType: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 · Estándar</SelectItem>
                  <SelectItem value="12">12 · Simplificada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factus-municipality">Municipio DANE predeterminado *</Label>
              <Input
                id="factus-municipality"
                inputMode="numeric"
                maxLength={5}
                value={form.factusDefaultMunicipalityCode ?? ''}
                onChange={(event) =>
                  set({
                    factusDefaultMunicipalityCode: event.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="Ej. 11001"
              />
              <p className="text-xs text-muted-foreground">
                Se configura una sola vez y se usa para los clientes habituales del lavadero.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Organización legal predeterminada</Label>
              <Select
                value={form.factusDefaultLegalOrganizationCode || '2'}
                onValueChange={(value) =>
                  set({ factusDefaultLegalOrganizationCode: value as '1' | '2' })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Persona natural</SelectItem>
                  <SelectItem value="1">Persona jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsabilidad tributaria predeterminada</Label>
              <Select
                value={form.factusDefaultTributeCode || 'ZZ'}
                onValueChange={(value) => set({ factusDefaultTributeCode: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZZ">No responsable de IVA</SelectItem>
                  <SelectItem value="01">Responsable de IVA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factus-tax-id">ID de impuesto en Factus</Label>
              <Input
                id="factus-tax-id"
                value={form.factusTaxId ?? ''}
                onChange={(event) => set({ factusTaxId: event.target.value })}
                placeholder="Vacío = servicio excluido"
              />
              <p className="text-xs text-muted-foreground">
                Es el código del impuesto de Factus, no el NIT del negocio.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factus-tax-rate">Tarifa del impuesto (%)</Label>
              <Input
                id="factus-tax-rate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.factusTaxRate ?? 0}
                onChange={(event) => set({ factusTaxRate: Number(event.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">Enviar factura por correo</p>
              <p className="text-xs text-muted-foreground">
                Factus la enviará al correo fiscal registrado del cliente.
              </p>
            </div>
            <Switch
              checked={Boolean(form.factusSendEmail)}
              onCheckedChange={(checked) => set({ factusSendEmail: checked })}
              aria-label="Enviar factura por correo"
            />
          </div>

          <Button type="submit" loading={saveBusiness.isPending}>
            Guardar configuración Factus
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Seguridad
// ---------------------------------------------------------------------

function SecurityTab() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch('/api/auth/password', { currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mi cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Field label="Nombre" value={user?.name ?? '—'} />
          <Field label="Correo" value={user?.email ?? '—'} />
          <Field label="Rol" value={user ? USER_ROLE_META[user.role].label : '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Repetir nueva contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" loading={submitting}>
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
