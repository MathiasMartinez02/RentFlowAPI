import { NotificationPriority, NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  prioridad?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

export interface CreateActivityInput {
  action: string;
  entityType: string;
  entityId: string;
  descripcion: string;
  metadata?: Record<string, unknown>;
}
