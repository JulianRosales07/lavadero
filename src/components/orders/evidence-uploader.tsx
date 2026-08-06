'use client';

import * as React from 'react';
import Image from 'next/image';
import { Camera, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpload } from '@/hooks/use-upload';
import { DAMAGE_TYPES, DAMAGE_TYPE_META, EVIDENCE_STAGE_META } from '@/lib/constants';
import type { DamageType, EvidenceStage } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface DraftEvidence {
  url: string;
  path: string | null;
  damageType: DamageType;
  note: string;
}

/**
 * Carga de fotografías del vehículo. En etapa INITIAL permite clasificar el
 * desperfecto (rayón, golpe, vidrio roto...); en FINAL solo una nota opcional.
 */
export function EvidenceUploader({
  stage,
  items,
  onChange,
  compact = false,
}: {
  stage: EvidenceStage;
  items: DraftEvidence[];
  onChange: (items: DraftEvidence[]) => void;
  compact?: boolean;
}) {
  const { uploading, uploadMany } = useUpload('evidences');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const meta = EVIDENCE_STAGE_META[stage];

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const uploaded = await uploadMany(Array.from(files));
    if (uploaded.length === 0) return;
    onChange([
      ...items,
      ...uploaded.map((file) => ({
        url: file.url,
        path: file.path,
        damageType: 'NONE' as DamageType,
        note: '',
      })),
    ]);
  };

  const update = (index: number, patch: Partial<DraftEvidence>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      {!compact ? (
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-primary/60 hover:bg-accent/40',
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Subiendo imágenes...</p>
          </>
        ) : (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Camera className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">Toma o arrastra fotos del vehículo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · hasta 10 MB cada una</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-1 pointer-events-none">
              <Upload />
              Seleccionar imágenes
            </Button>
          </>
        )}
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="flex gap-3 rounded-xl border border-border/70 bg-card p-3"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.url}
                  alt={`Evidencia ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                {stage === 'INITIAL' ? (
                  <Select
                    value={item.damageType}
                    onValueChange={(value) => update(index, { damageType: value as DamageType })}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAMAGE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {DAMAGE_TYPE_META[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <Input
                  value={item.note}
                  onChange={(event) => update(index, { note: event.target.value })}
                  placeholder="Detalle (opcional)"
                  className="h-9 text-[13px]"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label="Quitar evidencia"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center justify-center gap-2 rounded-lg bg-muted/40 py-3 text-xs text-muted-foreground">
          <ImagePlus className="size-4" aria-hidden />
          {stage === 'INITIAL'
            ? 'Sin evidencias iniciales. Recomendado antes de iniciar el servicio.'
            : 'Sin evidencias finales. Son opcionales.'}
        </p>
      )}
    </div>
  );
}
