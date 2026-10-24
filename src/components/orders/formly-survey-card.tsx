'use client';

import * as React from 'react';
import {
  Sparkles,
  ExternalLink,
  Copy,
  MessageCircle,
  QrCode,
  Star,
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/hooks/use-catalog';
import { useCreateOrderSurvey, useFormlyConfig, useOrderSurvey } from '@/hooks/use-formly';
import { digitsOnly } from '@/lib/utils';

interface FormlySurveyCardProps {
  orderId: string;
  orderNumber: string;
  customerPhone?: string | null;
  customerName?: string;
  orderStatus: string;
}

export function FormlySurveyCard({
  orderId,
  orderNumber,
  customerPhone,
  customerName = 'Cliente',
  orderStatus,
}: FormlySurveyCardProps) {
  const { data: business } = useBusiness();
  const { data: formlyConfig, isLoading: configLoading } = useFormlyConfig();
  const { data: survey, isLoading: surveyLoading } = useOrderSurvey(orderId);
  const createSurvey = useCreateOrderSurvey();
  const [qrOpen, setQrOpen] = React.useState(false);

  const surveyUrl = survey?.shareUrl || survey?.publicUrl || '';

  const handleCopyLink = async () => {
    if (!surveyUrl) return;
    try {
      await navigator.clipboard.writeText(surveyUrl);
      toast.success('Enlace de encuesta copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleWhatsApp = () => {
    if (!surveyUrl) return;
    const phone = customerPhone ? digitsOnly(customerPhone) : '';
    const biz = business?.name || 'nuestro Lavadero';
    const text = `Hola ${customerName}, gracias por confiar en ${biz}. Nos encantaría conocer tu opinión sobre nuestro servicio (Orden #${orderNumber}) para seguir mejorando. Puedes responder aquí:\n${surveyUrl}`;
    const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`size-4 ${
            i <= Math.round(rating)
              ? 'fill-amber-400 text-amber-500'
              : 'text-muted-foreground/30'
          }`}
        />,
      );
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const getNpsMeta = (nps: number) => {
    if (nps >= 9) {
      return {
        label: 'Promotor',
        icon: Smile,
        color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30',
      };
    }
    if (nps >= 7) {
      return {
        label: 'Pasivo',
        icon: Meh,
        color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-500/30',
      };
    }
    return {
      label: 'Detractor',
      icon: Frown,
      color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-500/30',
    };
  };

  return (
    <>
      <Card className="border-sky-500/30 bg-gradient-to-br from-card to-sky-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-sky-600 dark:text-sky-400" />
              Encuesta de Calidad Formly
            </CardTitle>
            {survey ? (
              <Badge
                variant="outline"
                className="border-sky-500/30 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              >
                {survey.totalResponses > 0 ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Respondida
                  </span>
                ) : (
                  'Activa'
                )}
              </Badge>
            ) : null}
          </div>
          <CardDescription>
            Medición de satisfacción, NPS y comentarios en tiempo real.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {surveyLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : survey ? (
            <div className="space-y-3">
              {/* Resultados recibidos */}
              {survey.totalResponses > 0 ? (
                <div className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">
                      Calificación General:
                    </span>
                    {survey.rating != null ? (
                      <div className="flex items-center gap-2">
                        {renderStars(Number(survey.rating))}
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {Number(survey.rating).toFixed(1)}/5
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Completada</span>
                    )}
                  </div>

                  {survey.npsScore != null ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Métrica NPS:</span>
                      {(() => {
                        const npsNum = Number(survey.npsScore);
                        const meta = getNpsMeta(npsNum);
                        const Icon = meta.icon;
                        return (
                          <div
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}
                          >
                            <Icon className="size-3.5" />
                            <span>
                              {npsNum}/10 · {meta.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}

                  {survey.feedback ? (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Comentario del cliente:
                      </p>
                      <p className="text-xs italic bg-muted/40 p-2 rounded text-foreground">
                        "{survey.feedback}"
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg bg-sky-50/70 p-3 text-xs text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                  <p className="font-medium">Encuesta publicada y lista para enviar.</p>
                  <p className="mt-0.5 text-muted-foreground dark:text-sky-400/80">
                    Comparte el enlace o el código QR con el cliente para recibir su calificación en tiempo real.
                  </p>
                </div>
              )}

              {/* Botones de acción rápida */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleCopyLink}
                >
                  <Copy className="size-3.5 mr-1" />
                  Copiar Enlace
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-emerald-600 dark:text-emerald-400"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="size-3.5 mr-1" />
                  WhatsApp
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setQrOpen(true)}
                >
                  <QrCode className="size-3.5 mr-1" />
                  Ver QR
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => window.open(surveyUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="size-3.5 mr-1" />
                  Abrir Formly
                </Button>
              </div>
            </div>
          ) : !formlyConfig?.hasApiKey && !business?.formlyApiKey ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Credenciales Formly requeridas</p>
                <p className="text-muted-foreground dark:text-amber-400/80">
                  Para emitir encuestas dinámicas, ingresa tu API Key oficial en Configuración.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => (window.location.href = '/configuracion?tab=formly')}
              >
                Ir a Configuración Formly
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Crea una encuesta automática con escalas de 1 a 5 estrellas, NPS de 0 a 10 y campos de mejora
                conectados al Formly B2B Engine.
              </p>
              <Button
                variant="default"
                size="sm"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                loading={createSurvey.isPending}
                onClick={() => createSurvey.mutate(orderId)}
              >
                <Sparkles className="size-4 mr-1.5" />
                Generar Encuesta Formly
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal con Código QR de la Encuesta */}
      {survey && (
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
          <DialogContent className="sm:max-w-xs text-center">
            <DialogHeader>
              <DialogTitle className="text-center">Código QR de Encuesta</DialogTitle>
              <DialogDescription className="text-center text-xs">
                Escanea con la cámara del celular para responder en Formly.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="rounded-xl border border-border p-3 bg-white shadow-sm">
                <QRCodeSVG value={surveyUrl} size={180} level="M" />
              </div>
              <p className="mt-3 text-xs font-mono text-muted-foreground break-all">
                {survey.shareUrl || survey.publicUrl}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
