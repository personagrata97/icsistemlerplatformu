import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let message = 'Sunucu hatası';
        const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

        if (exceptionResponse) {
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
                const msg = (exceptionResponse as any).message;
                message = Array.isArray(msg) ? msg.join(', ') : String(msg);
            }
        }

        // Translate common errors if no specific message is provided
        if (status === 401) {
            // Sadece varsayılan "Unauthorized" mesajı varsa veya mesaj boşsa genel çeviriyi yap
            if (!message || message === 'Unauthorized' || message === 'Sunucu hatası') {
                message = 'Oturum süreniz dolmuş veya giriş yapmadınız.';
            }
        }
        else if (status === 403) message = 'Bu işlem için yetkiniz bulunmamaktadır.';
        else if (status === 404) message = 'İstenen kaynak bulunamadı.';
        else if (status === 429) message = 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyiniz.';
        else if (status === 500) {
            message = 'Sunucu tarafında bir hata oluştu. Lütfen teknik ekibe bildiriniz.';
            if (exception instanceof Error) {
                this.logger.error(`[500] ${request.method} ${request.url} — ${exception.message}`, exception.stack);
            }
        }

        response
            .status(status)
            .json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message: message,
            });
    }
}
