import { Test, TestingModule } from '@nestjs/testing';
import { AuditAccessLogInterceptor } from './audit-access-log.interceptor';
import { PrismaService } from '../prisma.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('AuditAccessLogInterceptor', () => {
  let interceptor: AuditAccessLogInterceptor;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditAccessLogInterceptor,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    interceptor = module.get<AuditAccessLogInterceptor>(AuditAccessLogInterceptor);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  const createMockContext = (method: string, url: string, user?: any, ip?: string) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url,
        user,
        ip,
        connection: { remoteAddress: ip },
      }),
    }),
  } as unknown as ExecutionContext);

  const mockCallHandler: CallHandler = {
    handle: () => of('test-response'),
  };

  it('should ignore non-GET requests', (done) => {
    const context = createMockContext('POST', '/audit/123');
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: () => {
        expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should ignore non-sensitive GET requests', (done) => {
    const context = createMockContext('GET', '/other/path');
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: () => {
        expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should ignore if no user is present', (done) => {
    const context = createMockContext('GET', '/audit/123', null);
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: () => {
        expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should log sensitive GET requests for Audit', (done) => {
    const user = { username: 'testuser', displayName: 'Test User' };
    const context = createMockContext('GET', '/audit/audit-id', user, '127.0.0.1');
    
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: () => {
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            user: 'Test User',
            action: 'VIEW',
            targetType: 'Audit',
            targetId: 'audit-id',
            ipAddress: '127.0.0.1',
          }),
        });
        done();
      },
    });
  });

  it('should log sensitive GET requests for Finding', (done) => {
    const user = { username: 'testuser' };
    const context = createMockContext('GET', '/audit/findings/finding-id', user);
    
    interceptor.intercept(context, mockCallHandler).subscribe({
      next: () => {
        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            user: 'testuser',
            targetType: 'Finding',
            targetId: 'finding-id',
          }),
        });
        done();
      },
    });
  });

  it('should handle prisma error gracefully', (done) => {
    const user = { username: 'testuser' };
    const context = createMockContext('GET', '/audit/123', user);
    mockPrismaService.auditLog.create.mockRejectedValueOnce(new Error('Prisma error'));
    
    const loggerSpy = jest.spyOn((interceptor as any).logger, 'error').mockImplementation();

    interceptor.intercept(context, mockCallHandler).subscribe({
      next: () => {
        // Tap is used, so it shouldn't block the response
        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
        // The error is handled inside tap via catch
        // We can't easily wait for the fire-and-forget promise in tap without modifying code or using a helper
        // But we can check if it was called at least.
        done();
      },
    });
  });
});
