import { Test, TestingModule } from '@nestjs/testing';
import { SecureFileController } from './secure-file.controller';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { NotFoundException, ForbiddenException, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import { Response } from 'express';

jest.mock('fs');

describe('SecureFileController', () => {
  let controller: SecureFileController;
  let prisma: PrismaService;

  const mockResponse = {
    set: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecureFileController],
      providers: [
        { provide: PrismaService, useValue: {} },
        { provide: AuditLogService, useValue: { createLog: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SecureFileController>(SecureFileController);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEthicsFile', () => {
    it('should serve ethics file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue('stream');
      
      const result = await controller.getEthicsFile('test.pdf', 'TR-CODE', mockResponse, { user: { id: 'u1' } });
      
      expect(result).toBeInstanceOf(StreamableFile);
      expect(mockResponse.set).toHaveBeenCalledWith({ 'Content-Type': 'application/pdf' });
    });
  });

  describe('IDOR Protected Methods', () => {
    const mockUser = { id: 'u1', username: 'test' };
    
    it('getWorkpaperFile should throw if no user', async () => {
      await expect(controller.getWorkpaperFile('a1', 'f1.png', mockResponse, {}))
        .rejects.toThrow(ForbiddenException);
    });

    it('getWorkpaperFile should serve if user present', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        const result = await controller.getWorkpaperFile('a1', 'f1.png', mockResponse, { user: mockUser });
        expect(result).toBeInstanceOf(StreamableFile);
        expect(mockResponse.set).toHaveBeenCalledWith({ 'Content-Type': 'image/png' });
    });

    it('getEvidenceFile should throw if no user', async () => {
        await expect(controller.getEvidenceFile('f1.jpg', mockResponse, {}))
          .rejects.toThrow(ForbiddenException);
      });

    it('getAuditReportFile should throw if no user', async () => {
        await expect(controller.getAuditReportFile('a1', 'f1.docx', mockResponse, {}))
          .rejects.toThrow(ForbiddenException);
    });
    
    it('getIndependenceFile should throw if no user', async () => {
        await expect(controller.getIndependenceFile('f1.xlsx', mockResponse, {}))
          .rejects.toThrow(ForbiddenException);
    });
  });

  describe('serveFile Logic', () => {
    it('should throw NotFoundException if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      await expect(controller.getEthicsFile('missing.pdf', 'TR-CODE', mockResponse, { user: { id: 'u1' } }))
        .rejects.toThrow(NotFoundException);
    });

    it('should sanitize filename to prevent directory traversal', async () => {
        (fs.existsSync as jest.Mock).mockImplementation((path) => {
            // Check if directory traversal was removed
            if (path.includes('..')) return false;
            return true;
        });
        
        const result = await controller.getEthicsFile('../../../etc/passwd', 'TR-CODE', mockResponse, { user: { id: 'u1' } });
        expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should set octet-stream for unknown extensions', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        await controller.getEthicsFile('test.xyz', 'TR-CODE', mockResponse, { user: { id: 'u1' } });
        expect(mockResponse.set).toHaveBeenCalledWith({ 'Content-Type': 'application/octet-stream' });
    });
  });
});
