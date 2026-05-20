import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return { ...data, timestamp: data.timestamp ?? new Date().toISOString() };
        }

        return {
          success: true as const,
          message: (data as any)?.message ?? 'Operation successful',
          data: (data as any)?.data !== undefined ? (data as any).data : data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
