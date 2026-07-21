import { DocumentsService } from './documents.service';
import { NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';

describe('DocumentsService Security', () => {
    let service: DocumentsService;
    let prismaService: any;
    let auditronService: any;
    let auditLogService: any;

    beforeEach(() => {
        prismaService = {
            aiDocument: {
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
            },
        };
        auditronService = {
            processDocument: jest.fn(),
            deleteDocumentChunks: jest.fn(),
        };
        auditLogService = {
            createAuditLog: jest.fn().mockResolvedValue(true),
        };
        service = new DocumentsService(prismaService, auditronService, auditLogService);
    });

    it('should throw UnauthorizedException when serveFile is invoked without authenticated user', async () => {
        await expect(service.serveFile('doc-123', 'download', null)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when requested document does not exist', async () => {
        prismaService.aiDocument.findUnique.mockResolvedValue(null);
        const authenticatedUser = { id: 'user-1', roles: [{ code: 'AUDITOR' }] };

        await expect(service.serveFile('non-existent-doc', 'view', authenticatedUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks permissions for TEFTIS_KURULU documents', async () => {
        const privateDoc = {
            id: 'doc-private',
            title: 'Gizli Teftiş Raporu',
            category: 'TEFTIS_KURULU',
            filePath: '/tmp/fake.pdf',
            fileName: 'fake.pdf',
            mimeType: 'application/pdf',
        };
        prismaService.aiDocument.findUnique.mockResolvedValue(privateDoc);

        const unauthorizedUser = {
            id: 'unauth-user',
            username: 'external_user',
            roles: [{ code: 'AUDITEE' }],
        };

        await expect(service.serveFile('doc-private', 'view', unauthorizedUser)).rejects.toThrow(ForbiddenException);
    });
});
