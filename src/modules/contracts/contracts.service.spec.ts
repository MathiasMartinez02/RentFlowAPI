import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { ContractRepository } from './repositories/contract.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { ContractStatus } from '../../common/enums/contract.enum';
import { CreateContractDto } from './dto/create-contract.dto';

const mockContractRepository = {
  findPropertyByOwner: jest.fn(),
  findTenantByOwner: jest.fn(),
  countActiveByProperty: jest.fn(),
  create: jest.fn(),
  codeExists: jest.fn(),
  findMany: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  cancel: jest.fn(),
};

const mockNotificationsService = {
  notify: jest.fn().mockResolvedValue(undefined),
  logActivity: jest.fn().mockResolvedValue(undefined),
};

const ownerId = 'owner-1';

const baseDto: CreateContractDto = {
  propertyId: 'property-1',
  tenantId: 'tenant-1',
  fechaInicio: '2026-01-01',
  fechaFin: '2027-01-01',
  montoMensual: 180000,
  deposito: 360000,
} as CreateContractDto;

const existingContract = {
  id: 'contract-1',
  codigoContrato: 'CTR-2026-ABCDE',
  propertyId: 'property-1',
  tenantId: 'tenant-1',
  estado: ContractStatus.ACTIVO,
  fechaInicio: new Date('2026-01-01'),
  fechaFin: new Date('2027-01-01'),
};

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockContractRepository.codeExists.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: ContractRepository, useValue: mockContractRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get(ContractsService);
  });

  describe('create', () => {
    it('throws BadRequestException when fechaFin is not after fechaInicio', async () => {
      const dto = { ...baseDto, fechaInicio: '2027-01-01', fechaFin: '2026-01-01' };

      await expect(service.create(ownerId, dto)).rejects.toThrow(BadRequestException);
      expect(mockContractRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the property does not belong to the owner', async () => {
      mockContractRepository.findPropertyByOwner.mockResolvedValue(null);
      mockContractRepository.findTenantByOwner.mockResolvedValue({ id: 'tenant-1' });

      await expect(service.create(ownerId, baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the tenant does not belong to the owner', async () => {
      mockContractRepository.findPropertyByOwner.mockResolvedValue({ id: 'property-1' });
      mockContractRepository.findTenantByOwner.mockResolvedValue(null);

      await expect(service.create(ownerId, baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the property already has an active contract', async () => {
      mockContractRepository.findPropertyByOwner.mockResolvedValue({ id: 'property-1' });
      mockContractRepository.findTenantByOwner.mockResolvedValue({ id: 'tenant-1' });
      mockContractRepository.countActiveByProperty.mockResolvedValue(1);

      await expect(service.create(ownerId, baseDto)).rejects.toThrow(ConflictException);
      expect(mockContractRepository.create).not.toHaveBeenCalled();
    });

    it('creates the contract, notifies and logs activity on success', async () => {
      mockContractRepository.findPropertyByOwner.mockResolvedValue({ id: 'property-1' });
      mockContractRepository.findTenantByOwner.mockResolvedValue({ id: 'tenant-1' });
      mockContractRepository.countActiveByProperty.mockResolvedValue(0);
      mockContractRepository.create.mockResolvedValue(existingContract);

      const result = await service.create(ownerId, baseDto);

      expect(result).toEqual(existingContract);
      expect(mockContractRepository.create).toHaveBeenCalledWith(
        ownerId,
        baseDto,
        expect.stringMatching(/^CTR-\d{4}-[A-Z0-9]{5}$/),
      );
      expect(mockNotificationsService.notify).toHaveBeenCalled();
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'CONTRACT_CREATED', entityId: existingContract.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the contract does not exist', async () => {
      mockContractRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', ownerId, {})).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the contract is already cancelled', async () => {
      mockContractRepository.findById.mockResolvedValue({
        ...existingContract,
        estado: ContractStatus.CANCELADO,
      });

      await expect(service.update(existingContract.id, ownerId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates the contract and notifies when moving to PROXIMO_A_VENCER', async () => {
      mockContractRepository.findById.mockResolvedValue(existingContract);
      mockContractRepository.update.mockResolvedValue({
        ...existingContract,
        estado: ContractStatus.PROXIMO_A_VENCER,
      });

      await service.update(existingContract.id, ownerId, {
        estado: ContractStatus.PROXIMO_A_VENCER,
      });

      expect(mockNotificationsService.notify).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ titulo: 'Contrato próximo a vencer' }),
      );
    });
  });

  describe('remove', () => {
    it('throws BadRequestException when the contract is already cancelled', async () => {
      mockContractRepository.findById.mockResolvedValue({
        ...existingContract,
        estado: ContractStatus.CANCELADO,
      });

      await expect(service.remove(existingContract.id, ownerId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockContractRepository.cancel).not.toHaveBeenCalled();
    });

    it('cancels the contract and logs activity', async () => {
      mockContractRepository.findById.mockResolvedValue(existingContract);
      mockContractRepository.cancel.mockResolvedValue(undefined);

      await service.remove(existingContract.id, ownerId);

      expect(mockContractRepository.cancel).toHaveBeenCalledWith(
        existingContract.id,
        existingContract.propertyId,
      );
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'CONTRACT_CANCELLED' }),
      );
    });
  });
});
