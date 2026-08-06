'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { UploadedFile } from '@/lib/types';

type Folder = 'vehicles' | 'evidences' | 'logos' | 'avatars';

const MAX_SIZE = 10 * 1024 * 1024;

/** Sube imágenes al backend, que las guarda en Supabase Storage. */
export function useUpload(folder: Folder) {
  const [uploading, setUploading] = React.useState(false);

  const uploadMany = React.useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      const valid = files.filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} no es una imagen`);
          return false;
        }
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} supera los 10 MB`);
          return false;
        }
        return true;
      });

      if (valid.length === 0) return [];

      setUploading(true);
      try {
        const formData = new FormData();
        for (const file of valid) formData.append('files', file);
        formData.append('folder', folder);

        const result = await api.upload<{ files: UploadedFile[] }>('/api/uploads/batch', formData);
        return result.files;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudieron subir las imágenes');
        return [];
      } finally {
        setUploading(false);
      }
    },
    [folder],
  );

  const uploadOne = React.useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      const result = await uploadMany([file]);
      return result[0] ?? null;
    },
    [uploadMany],
  );

  return { uploading, uploadOne, uploadMany };
}
