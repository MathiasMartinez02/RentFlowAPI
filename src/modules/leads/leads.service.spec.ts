import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { LeadRepository } from './repositories/lead.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { LeadStatus } from '../../common/enums/lead.enum';
import { CreateLeadDto } from './dto/create-lead.dto';

const mockLeadRepository = {
  create: jest.fn(),
  findMany: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findPropertyByOwner: jest.fn(),
  getOverviewStats: jest.fn(),
};

const mockNotificationsService = {
  notify: jest.fn().mockResolvedValue(undefined),
  logActivity: jest.fn().mockResolvedValue(undefined),
};

const ownerId = 'owner-1';

const baseDto: CreateLeadDto = {
  nombre: 'Juan Pérez',
  email: 'juan.perez@email.com',
  telefono: '+54 11 5555-5555',
} as CreateLeadDto;

const existingLead = {
  id: 'lead-1',
  nombre: 'Juan Pérez',
  email: 'juan.perez@email.com',
  telefono: '+54 11 5555-5555',
  propertyId: null,
  estado: LeadStatus.NUEVO,
};

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: LeadRepository, useValue: mockLeadRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get(LeadsService);
  });

  describe('create', () => {
    it('throws NotFoundException when propertyId is given but does not belong to the owner', async () => {
      mockLeadRepository.findPropertyByOwner.mockResolvedValue(null);

      await expect(
        service.create(ownerId, { ...baseDto, propertyId: 'property-1' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockLeadRepository.create).not.toHaveBeenCalled();
    });

    it('creates the lead, notifies and logs activity on success', async () => {
      mockLeadRepository.create.mockResolvedValue(existingLead);

      const result = await service.create(ownerId, baseDto);

      expect(result).toEqual(existingLead);
      expect(mockLeadRepository.create).toHaveBeenCalledWith(ownerId, baseDto);
      expect(mockNotificationsService.notify).toHaveBeenCalled();
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'LEAD_CREATED', entityId: existingLead.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the lead does not exist', async () => {
      mockLeadRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', ownerId, {})).rejects.toThrow(NotFoundException);
    });

    it('notifies when the lead transitions to VISITA_AGENDADA and logs the status change', async () => {
      mockLeadRepository.findById.mockResolvedValue(existingLead);
      mockLeadRepository.update.mockResolvedValue({
        ...existingLead,
        estado: LeadStatus.VISITA_AGENDADA,
      });

      await service.update(existingLead.id, ownerId, { estado: LeadStatus.VISITA_AGENDADA });

      expect(mockNotificationsService.notify).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ titulo: 'Visita agendada' }),
      );
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'LEAD_STATUS_CHANGED' }),
      );
    });

    it('logs a plain LEAD_UPDATED activity when no status change is involved', async () => {
      mockLeadRepository.findById.mockResolvedValue(existingLead);
      mockLeadRepository.update.mockResolvedValue(existingLead);

      await service.update(existingLead.id, ownerId, { notas: 'Llamar de nuevo' });

      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'LEAD_UPDATED' }),
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes the lead and logs activity', async () => {
      mockLeadRepository.findById.mockResolvedValue(existingLead);

      await service.remove(existingLead.id, ownerId);

      expect(mockLeadRepository.softDelete).toHaveBeenCalledWith(existingLead.id);
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'LEAD_DELETED' }),
      );
    });
  });
});
