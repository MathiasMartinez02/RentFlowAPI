import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { IStorageProvider, SavedFile, UploadFolder } from '../interfaces/storage.interface';
import { generateSafeFilename } from '../utils/file.util';

@Injectable()
export class LocalStorageService implements IStorageProvider, OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  async onModuleInit(): Promise<void> {
    const folders: UploadFolder[] = ['properties', 'avatars'];
    await Promise.all(
      folders.map((folder) =>
        mkdir(join(this.uploadsRoot, folder), { recursive: true }).catch(() => undefined),
      ),
    );
    this.logger.log(`Upload directories ready at: ${this.uploadsRoot}`);
  }

  async save(file: Express.Multer.File, folder: UploadFolder): Promise<SavedFile> {
    const filename = generateSafeFilename(file.originalname);
    const filepath = join(this.uploadsRoot, folder, filename);
    await writeFile(filepath, file.buffer);
    return {
      url: `/uploads/${folder}/${filename}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(filename: string, folder: UploadFolder): Promise<void> {
    const filepath = join(this.uploadsRoot, folder, filename);
    await unlink(filepath).catch((err: Error) =>
      this.logger.warn(`Could not delete file ${filename}: ${err.message}`),
    );
  }
}
