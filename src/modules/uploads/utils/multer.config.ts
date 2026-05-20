import { memoryStorage } from 'multer';
import { MAX_FILE_SIZE, multerFileFilter } from './file.util';

export const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter: multerFileFilter,
};
