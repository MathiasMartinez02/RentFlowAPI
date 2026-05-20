import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
  UploadFolder,
} from '../interfaces/storage.interface';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  async uploadPropertyImages(
    files: Express.Multer.File[],
    propertyId: string,
    ownerId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerId, isActive: true },
      select: { id: true, imagenPrincipal: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    const folder: UploadFolder = 'properties';
    const savedFiles = await Promise.all(files.map((file) => this.storage.save(file, folder)));

    const images = await this.prisma.$transaction(
      savedFiles.map((saved) =>
        this.prisma.propertyImage.create({
          data: {
            propertyId,
            url: saved.url,
            filename: saved.filename,
            mimeType: saved.mimeType,
            size: saved.size,
          },
        }),
      ),
    );

    if (!property.imagenPrincipal && savedFiles.length > 0) {
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { imagenPrincipal: savedFiles[0].url },
      });
    }

    this.logger.log(`${images.length} imágenes subidas para propiedad ${propertyId}`);
    return images;
  }

  async getPropertyImages(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerId, isActive: true },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    return this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePropertyImage(imageId: string, ownerId: string) {
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, property: { ownerId } },
    });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.storage.delete(image.filename, 'properties');
    await this.prisma.propertyImage.delete({ where: { id: imageId } });

    const remaining = await this.prisma.propertyImage.findFirst({
      where: { propertyId: image.propertyId },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.property.update({
      where: { id: image.propertyId },
      data: { imagenPrincipal: remaining?.url ?? null },
    });

    this.logger.log(`Imagen ${imageId} eliminada`);
  }

  async uploadAvatar(file: Express.Multer.File, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (user?.avatar) {
      const oldFilename = user.avatar.split('/').pop();
      if (oldFilename) {
        await this.storage.delete(oldFilename, 'avatars');
      }
    }

    const saved = await this.storage.save(file, 'avatars');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: saved.url },
      select: { id: true, avatar: true, nombre: true, apellido: true, email: true },
    });

    this.logger.log(`Avatar actualizado para usuario ${userId}`);
    return updated;
  }
}
