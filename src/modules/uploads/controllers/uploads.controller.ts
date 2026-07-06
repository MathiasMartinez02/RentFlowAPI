import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AvatarResponseDto, PropertyImagesResponseDto } from '../dto/upload-response.dto';
import { UploadsService } from '../services/uploads.service';
import { multerOptions } from '../utils/multer.config';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('property/:propertyId')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  @ApiOperation({ summary: 'Subir imágenes a una propiedad (máx. 10 archivos, 5MB c/u)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Imágenes (jpg, jpeg, png, webp — máx. 5MB cada una)',
        },
      },
      required: ['files'],
    },
  })
  @ApiCreatedResponse({ type: PropertyImagesResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  async uploadPropertyImages(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') ownerId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadsService.uploadPropertyImages(files, propertyId, ownerId);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Listar imágenes de una propiedad' })
  @ApiOkResponse({ type: PropertyImagesResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  async getPropertyImages(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.uploadsService.getPropertyImages(propertyId, ownerId);
  }

  @Delete('property/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una imagen de propiedad' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Imagen no encontrada' })
  async deletePropertyImage(@Param('imageId') imageId: string, @CurrentUser('id') ownerId: string) {
    return this.uploadsService.deletePropertyImage(imageId, ownerId);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiOperation({ summary: 'Subir o actualizar avatar del usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de avatar (jpg, jpeg, png, webp — máx. 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ type: AvatarResponseDto })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser('id') userId: string) {
    return this.uploadsService.uploadAvatar(file, userId);
  }
}
