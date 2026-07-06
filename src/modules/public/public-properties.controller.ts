import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { QueryPublicPropertiesDto } from './dto/query-public-properties.dto';
import { PublicPropertiesService } from './public-properties.service';

@ApiTags('Sitio público')
@Controller('public/properties')
export class PublicPropertiesController {
  constructor(private readonly publicPropertiesService: PublicPropertiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar propiedades publicadas (sin autenticación)' })
  @ApiOkResponse({ description: 'Listado paginado de propiedades publicadas' })
  findAll(@Query() query: QueryPublicPropertiesDto) {
    return this.publicPropertiesService.findMany(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle de una propiedad publicada (sin autenticación)' })
  @ApiOkResponse({ description: 'Detalle de la propiedad' })
  findOne(@Param('id') id: string) {
    return this.publicPropertiesService.findById(id);
  }
}
