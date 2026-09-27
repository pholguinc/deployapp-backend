import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, map, of } from 'rxjs';
import type { Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  statusCode: number;
  status: 'success' | false;
  message: unknown;
  data?: T | null;
  error?: unknown;
}

@Injectable()
export class ResponseInterceptor<T = unknown> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // No interceptar rutas de documentación OpenAPI / Swagger
    if (request.url?.includes('/docs')) {
      return next.handle() as unknown as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data: T): ApiResponse<T> => {
        const statusCode = response.statusCode || HttpStatus.OK;

        let message: unknown = 'Operación exitosa';
        let responseData: T | null = data;

        if (data && typeof data === 'object') {
          const record = data as Record<string, unknown>;
          if ('message' in record && typeof record.message === 'string') {
            message = record.message;
            if (Object.keys(record).length === 1) {
              responseData = null;
            }
          }
        }

        return {
          statusCode,
          status: 'success',
          message,
          data: responseData,
        };
      }),
      catchError((err: unknown) => {
        const statusCode =
          err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const errorResponse =
          err instanceof HttpException ? err.getResponse() : null;

        let message: unknown = 'Ocurrió un error inesperado';
        let errorDetail: unknown = null;

        if (typeof errorResponse === 'string') {
          message = errorResponse;
        } else if (
          typeof errorResponse === 'object' &&
          errorResponse !== null
        ) {
          const resp = errorResponse as Record<string, unknown>;
          if (resp.message) {
            message = resp.message;
          }
          if (resp.error) {
            errorDetail = resp.error;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }

        response.status(statusCode);

        return of<ApiResponse<T>>({
          statusCode,
          status: false,
          message,
          ...(errorDetail ? { error: errorDetail } : {}),
        });
      }),
    );
  }
}
