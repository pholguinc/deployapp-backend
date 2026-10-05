import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // No interceptar rutas de documentación OpenAPI / Swagger
    if (request.url?.includes('/docs')) {
      return;
    }

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: unknown = 'Ocurrió un error inesperado';
    let errorDetail: unknown = null;

    if (typeof errorResponse === 'string') {
      message = errorResponse;
    } else if (typeof errorResponse === 'object' && errorResponse !== null) {
      const resp = errorResponse as Record<string, unknown>;
      if (resp.message) {
        message = resp.message;
      }
      if (resp.error) {
        errorDetail = resp.error;
      }
    } else if (exception instanceof Error) {
      console.error('[Internal Server Error]:', exception.message);
      message = 'Ocurrió un error inesperado en el servidor';
    }

    response.status(statusCode).json({
      statusCode,
      status: false,
      message,
      ...(errorDetail ? { error: errorDetail } : {}),
    });
  }
}
