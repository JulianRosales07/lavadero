'use client';

import * as React from 'react';
import { Camera, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCustomer, useUpdateCustomer, type VehicleInput } from '@/hooks/use-customers';
import { useUpload } from '@/hooks/use-upload';
import { VEHICLE_TYPES, VEHICLE_TYPE_META } from '@/lib/constants';
import type { Customer, IdentificationDocumentCode } from '@/lib/types';
import { cn } from '@/lib/utils';

const emptyVehicle = (): VehicleInput => ({
  plate: '',
  brand: '',
  model: '',
  color: '',
  type: 'CAR',
  photoUrl: null,
});

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, el diálogo edita en lugar de crear. */
  customer?: Customer | null;
  /** Se dispara tras crear: permite abrir la orden automáticamente. */
  onCreated?: (customer: Customer) => void;
}) {
  const editing = Boolean(customer);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [identificationDocumentCode, setIdentificationDocumentCode] =
    React.useState<IdentificationDocumentCode | ''>('13');
  const [identification, setIdentification] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [vehicles, setVehicles] = React.useState<VehicleInput[]>([emptyVehicle()]);

  // Rellena el formulario al abrir
  React.useEffect(() => {
    if (!open) return;
    setFirstName(customer?.firstName ?? '');
    setLastName(customer?.lastName ?? '');
    setPhone(customer?.phone ?? '');
    setEmail(customer?.email ?? '');
    setNotes(customer?.notes ?? '');
    setIdentificationDocumentCode(customer?.identificationDocumentCode ?? '13');
    setIdentification(customer?.identification ?? '');
    setAddress(customer?.address ?? '');
    setVehicles(customer ? [] : [emptyVehicle()]);
  }, [open, customer]);

  const updateVehicle = (index: number, patch: Partial<VehicleInput>) => {
    setVehicles((prev) => prev.map((vehicle, i) => (i === index ? { ...vehicle, ...patch } : vehicle)));
  };

  const submitting = createCustomer.isPending || updateCustomer.isPending;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!firstName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const cleanVehicles = vehicles
      .filter((vehicle) => vehicle.plate.trim().length > 1)
      .map((vehicle) => ({
        ...vehicle,
        plate: vehicle.plate.trim().toUpperCase(),
        brand: vehicle.brand?.trim() || null,
        model: vehicle.model?.trim() || null,
        color: vehicle.color?.trim() || null,
      }));

    if (!editing && cleanVehicles.length === 0) {
      toast.error('Registra al menos un vehículo con placa');
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      identificationDocumentCode: identificationDocumentCode || null,
      identification: identification.trim() || null,
      address: address.trim() || null,
    };

    if (editing && customer) {
      await updateCustomer.mutateAsync({ id: customer.id, ...payload });
      onOpenChange(false);
      return;
    }

    const created = await createCustomer.mutateAsync({ ...payload, vehicles: cleanVehicles });
    toast.success('Cliente registrado');
    onOpenChange(false);
    onCreated?.(created);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Actualiza los datos de contacto del cliente.'
              : 'Registra el cliente y su vehículo. Al guardar podrás crear la orden de inmediato.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombres *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Juan Carlos"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Pérez Rojas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="300 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@correo.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Preferencias, acuerdos, datos de facturación..."
                className="min-h-[70px]"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Datos de facturación electrónica (opcional)</h3>
              <p className="text-xs text-muted-foreground">
                Solo necesario si vas a emitir factura electrónica. Completa el tipo y número de documento.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  value={identificationDocumentCode || '__none__'}
                  onValueChange={(value) =>
                    setIdentificationDocumentCode(
                      value === '__none__' ? '' : (value as IdentificationDocumentCode),
                    )
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin especificar</SelectItem>
                    <SelectItem value="13">Cédula de ciudadanía</SelectItem>
                    <SelectItem value="31">NIT</SelectItem>
                    <SelectItem value="22">Cédula de extranjería</SelectItem>
                    <SelectItem value="12">Tarjeta de identidad</SelectItem>
                    <SelectItem value="41">Pasaporte</SelectItem>
                    <SelectItem value="11">Registro civil</SelectItem>
                    <SelectItem value="47">Permiso especial de permanencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="identification">Número de documento</Label>
                <Input
                  id="identification"
                  value={identification}
                  onChange={(event) => setIdentification(event.target.value)}
                  placeholder="Ej: 1234567890"
                />
              </div>
            </div>
          </div>

          {!editing && (
            <>
              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Información del vehículo</h3>
                    <p className="text-xs text-muted-foreground">
                      Puedes registrar más de un vehículo por cliente.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVehicles((prev) => [...prev, emptyVehicle()])}
                  >
                    <Plus />
                    Agregar
                  </Button>
                </div>

                {vehicles.map((vehicle, index) => (
                  <VehicleFields
                    key={index}
                    vehicle={vehicle}
                    index={index}
                    removable={vehicles.length > 1}
                    onChange={(patch) => updateVehicle(index, patch)}
                    onRemove={() => setVehicles((prev) => prev.filter((_, i) => i !== index))}
                  />
                ))}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Guardar cambios' : 'Guardar y crear orden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Bloque de campos de un vehículo, con carga de fotografía. */
function VehicleFields({
  vehicle,
  index,
  removable,
  onChange,
  onRemove,
}: {
  vehicle: VehicleInput;
  index: number;
  removable: boolean;
  onChange: (patch: Partial<VehicleInput>) => void;
  onRemove: () => void;
}) {
  const { uploading, uploadOne } = useUpload('vehicles');
  const inputId = `vehicle-photo-${index}`;

  const onPickPhoto = async (file?: File) => {
    if (!file) return;
    const uploaded = await uploadOne(file);
    if (uploaded) onChange({ photoUrl: uploaded.url });
  };

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-2 pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vehículo {index + 1}
        </p>
        {removable ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Quitar vehículo">
            <X />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Fotografía */}
        <div className="shrink-0">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void onPickPhoto(event.target.files?.[0])}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'relative grid size-[104px] cursor-pointer place-items-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary',
              vehicle.photoUrl && 'border-solid border-border',
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : vehicle.photoUrl ? (
              <>
                <img
                  src={vehicle.photoUrl}
                  alt="Fotografía del vehículo"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 py-1 text-center text-[10px] font-medium text-white">
                  Cambiar
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-1 text-center">
                <Camera className="size-5" aria-hidden />
                <span className="text-[10px] font-medium leading-tight">Foto del vehículo</span>
              </span>
            )}
          </label>

          {vehicle.photoUrl ? (
            <button
              type="button"
              onClick={() => onChange({ photoUrl: null })}
              className="mt-1.5 flex w-[104px] items-center justify-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-3" />
              Quitar
            </button>
          ) : null}
        </div>

        {/* Datos */}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`plate-${index}`} className="text-xs">
              Placa *
            </Label>
            <Input
              id={`plate-${index}`}
              value={vehicle.plate}
              onChange={(event) => onChange({ plate: event.target.value.toUpperCase() })}
              placeholder="ABC-123"
              className="font-medium uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`type-${index}`} className="text-xs">
              Tipo de vehículo
            </Label>
            <Select value={vehicle.type} onValueChange={(type) => onChange({ type: type as VehicleInput['type'] })}>
              <SelectTrigger id={`type-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{VEHICLE_TYPE_META[type].icon}</span>
                      {VEHICLE_TYPE_META[type].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`brand-${index}`} className="text-xs">
              Marca
            </Label>
            <Input
              id={`brand-${index}`}
              value={vehicle.brand ?? ''}
              onChange={(event) => onChange({ brand: event.target.value })}
              placeholder="Toyota"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`model-${index}`} className="text-xs">
              Modelo
            </Label>
            <Input
              id={`model-${index}`}
              value={vehicle.model ?? ''}
              onChange={(event) => onChange({ model: event.target.value })}
              placeholder="Yaris"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`color-${index}`} className="text-xs">
              Color
            </Label>
            <Input
              id={`color-${index}`}
              value={vehicle.color ?? ''}
              onChange={(event) => onChange({ color: event.target.value })}
              placeholder="Plateado"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
