import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PaymentRepository } from './repositories/payment.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentStatus } from '../../common/enums/payment.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';

const mockPaymentRepository = {
  findContractByOwner: jest.fn(),
  existsByContractAndPeriodo: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  getOverviewStats: jest.fn(),
};

const mockNotificationsService = {
  notify: jest.fn().mockResolvedValue(undefined),
  logActivity: jest.fn().mockResolvedValue(undefined),
};

const ownerId = 'owner-1';
const contract = { id: 'contract-1', tenantId: 'tenant-1', propertyId: 'property-1' };

const baseDto: CreatePaymentDto = {
  contractId: 'contract-1',
  periodo: '2026-07',
  fechaVencimiento: '2026-07-05',
  monto: 180000,
} as CreatePaymentDto;

const existingPayment = {
  id: 'payment-1',
  periodo: '2026-07',
  monto: 180000,
  mora: 0,
  totalPagado: null,
  estado: PaymentStatus.PENDIENTE,
  fechaVencimiento: new Date('2026-07-05'),
  fechaPago: null,
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentRepository, useValue: mockPaymentRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe('create', () => {
    it('throws NotFoundException when the contract does not belong to the owner', async () => {
      mockPaymentRepository.findContractByOwner.mockResolvedValue(null);

      await expect(service.create(ownerId, baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when a payment already exists for that contract/periodo', async () => {
      mockPaymentRepository.findContractByOwner.mockResolvedValue(contract);
      mockPaymentRepository.existsByContractAndPeriodo.mockResolvedValue(true);

      await expect(service.create(ownerId, baseDto)).rejects.toThrow(ConflictException);
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when estado is PAGADO without fechaPago', async () => {
      mockPaymentRepository.findContractByOwner.mockResolvedValue(contract);
      mockPaymentRepository.existsByContractAndPeriodo.mockResolvedValue(false);

      await expect(
        service.create(ownerId, { ...baseDto, estado: PaymentStatus.PAGADO }),
      ).rejects.toThrow(BadRequestException);
    });

    it('defaults totalPagado to monto + mora when marking as PAGADO', async () => {
      mockPaymentRepository.findContractByOwner.mockResolvedValue(contract);
      mockPaymentRepository.existsByContractAndPeriodo.mockResolvedValue(false);
      mockPaymentRepository.create.mockResolvedValue(existingPayment);

      await service.create(ownerId, {
        ...baseDto,
        estado: PaymentStatus.PAGADO,
        fechaPago: '2026-07-03',
        mora: 5000,
      });

      const [, , , resolvedDto] = mockPaymentRepository.create.mock.calls[0];
      expect(resolvedDto.totalPagado).toBe(185000);
    });

    it('creates the payment, notifies and logs activity on success', async () => {
      mockPaymentRepository.findContractByOwner.mockResolvedValue(contract);
      mockPaymentRepository.existsByContractAndPeriodo.mockResolvedValue(false);
      mockPaymentRepository.create.mockResolvedValue(existingPayment);

      const result = await service.create(ownerId, baseDto);

      expect(result).toEqual(existingPayment);
      expect(mockNotificationsService.notify).toHaveBeenCalled();
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'PAYMENT_CREATED', entityId: existingPayment.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the payment does not exist', async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', ownerId, {})).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the payment is already CANCELADO', async () => {
      mockPaymentRepository.findById.mockResolvedValue({
        ...existingPayment,
        estado: PaymentStatus.CANCELADO,
      });

      await expect(service.update(existingPayment.id, ownerId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when moving to PAGADO without any fechaPago', async () => {
      mockPaymentRepository.findById.mockResolvedValue(existingPayment);

      await expect(
        service.update(existingPayment.id, ownerId, { estado: PaymentStatus.PAGADO }),
      ).rejects.toThrow(BadRequestException);
    });

    it('notifies when the payment transitions into PAGADO', async () => {
      mockPaymentRepository.findById.mockResolvedValue(existingPayment);
      mockPaymentRepository.update.mockResolvedValue({
        ...existingPayment,
        estado: PaymentStatus.PAGADO,
      });

      await service.update(existingPayment.id, ownerId, {
        estado: PaymentStatus.PAGADO,
        fechaPago: '2026-07-03',
      });

      expect(mockNotificationsService.notify).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ titulo: 'Pago registrado' }),
      );
      expect(mockNotificationsService.logActivity).toHaveBeenCalledWith(
        ownerId,
        expect.objectContaining({ action: 'PAYMENT_PAID' }),
      );
    });

    it('auto-calculates mora when transitioning into VENCIDO without an explicit value', async () => {
      const overdue = {
        ...existingPayment,
        fechaVencimiento: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      };
      mockPaymentRepository.findById.mockResolvedValue(overdue);
      mockPaymentRepository.update.mockResolvedValue({ ...overdue, estado: PaymentStatus.VENCIDO });

      await service.update(existingPayment.id, ownerId, { estado: PaymentStatus.VENCIDO });

      const [, data] = mockPaymentRepository.update.mock.calls[0];
      expect(data.mora).toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('throws BadRequestException when the payment is already CANCELADO', async () => {
      mockPaymentRepository.findById.mockResolvedValue({
        ...existingPayment,
        estado: PaymentStatus.CANCELADO,
      });

      await expect(service.remove(existingPayment.id, ownerId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPaymentRepository.softDelete).not.toHaveBeenCalled();
    });

    it('soft-deletes the payment otherwise', async () => {
      mockPaymentRepository.findById.mockResolvedValue(existingPayment);

      await service.remove(existingPayment.id, ownerId);

      expect(mockPaymentRepository.softDelete).toHaveBeenCalledWith(existingPayment.id);
    });
  });
});
