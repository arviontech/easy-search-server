import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = (res as any).message || message;
    } else if (exception instanceof Error) {
      // In production, do not expose internal error messages
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal Server Error'
          : exception.message;
    }

    const responseBody = {
      success: false,
      statusCode: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
