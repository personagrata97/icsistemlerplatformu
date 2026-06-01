// DOMMatrix polyfill for dependencies that expect it (like @napi-rs/canvas used by pdf-parse)
if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        constructor() { }
        static fromMatrix() { return new DOMMatrix(); }
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
    };
}

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';
import { join } from 'path';

async function bootstrap() {
    // --- NESTJS APP INITIALIZATION ---
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false, // Varsayılan limitleri devre dışı bırakıyoruz ki aşağıdakiler geçerli olsun
    });

    // --- BODY PARSER LIMITS ---
    // Büyük örneklem popülasyonları ve dosya içerikleri için limit artırımı (500MB kafa payı)
    const { json, urlencoded } = await import('express');
    app.use(json({ limit: '500mb' }));
    app.use(urlencoded({ extended: true, limit: '500mb' }));


    // --- STATIC FILES ---
    // Yüklenen personel fotoğrafları vb. için statik dosya sunumu
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads',
    });

    // --- GÜVENLİK BAŞLIKLARI ---
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // Next.js gereksinimi
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['http://localhost:3000', 'http://localhost:3001'])],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
            }
        },
        crossOriginEmbedderPolicy: false,
        // İntranet güvenlik başlıkları
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        hsts: { maxAge: 31536000, includeSubDomains: true },
    }));

    // --- CORS ---
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3010'];

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        exposedHeaders: ['Content-Disposition']
    });

    // --- GLOBAL PIPES, FILTERS & INTERCEPTORS ---
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    // --- API VERSIONING ---
    app.setGlobalPrefix('api/v1');

    // Port
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');

    const logger = new Logger('Bootstrap');
    logger.log(`İç Sistemler Platformu çalışıyor: http://localhost:${port}`);
}

bootstrap();
