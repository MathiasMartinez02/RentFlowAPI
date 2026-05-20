import { ApiProperty } from '@nestjs/swagger';

export class PropertyImageDto {
  @ApiProperty() id: string;
  @ApiProperty() url: string;
  @ApiProperty() filename: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() size: number;
  @ApiProperty() propertyId: string;
  @ApiProperty() createdAt: Date;
}

export class PropertyImagesResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({ type: [PropertyImageDto] }) data: PropertyImageDto[];
}

export class AvatarResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      avatar: { type: 'string' },
      nombre: { type: 'string' },
      apellido: { type: 'string' },
      email: { type: 'string' },
    },
  })
  data: unknown;
}
