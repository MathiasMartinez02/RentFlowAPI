import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { PublicLeadsService } from './public-leads.service';

// Límite propio para el formulario de contacto público — más estricto que el general,
// para no depender solo del throttle global frente a spam/abuso de un endpoint sin login.
const CONTACT_FORM_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Sitio público')
@Controller('public/leads')
export class PublicLeadsController {
  constructor(private readonly publicLeadsService: PublicLeadsService) {}

  @Public()
  @Throttle(CONTACT_FORM_THROTTLE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enviar una consulta desde el formulario público de contacto' })
  @ApiCreatedResponse({ description: 'Lead creado' })
  create(@Body() dto: CreatePublicLeadDto) {
    return this.publicLeadsService.create(dto);
  }
}
