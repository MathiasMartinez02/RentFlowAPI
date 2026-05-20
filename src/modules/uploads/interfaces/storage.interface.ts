export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export type UploadFolder = 'properties' | 'avatars';

export interface SavedFile {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface IStorageProvider {
  save(file: Express.Multer.File, folder: UploadFolder): Promise<SavedFile>;
  delete(filename: string, folder: UploadFolder): Promise<void>;
}
