import { extname } from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function generateSafeFilename(originalname: string): string {
  const rawExt = extname(originalname).toLowerCase();
  const safeExt = rawExt.replace(/[^.a-z0-9]/g, '');
  return `${randomUUID()}${safeExt}`;
}

export function multerFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: jpg, jpeg, png, webp`,
      ),
      false,
    );
  }
}
