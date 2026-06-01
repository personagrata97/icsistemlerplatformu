import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../common/prisma.service';
import { Logger } from '@nestjs/common';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditableUnit: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTree', () => {
    it('should build hierarchical tree from flat units', async () => {
      const flatUnits = [
        { id: '1', name: 'Root', parentId: null, type: 'Daire' },
        { id: '2', name: 'Child 1', parentId: '1', type: 'Birim' },
        { id: '3', name: 'Child 2', parentId: '1', type: 'Birim' },
        { id: '4', name: 'Grandchild', parentId: '2', type: 'Servis' },
      ];
      mockPrismaService.auditableUnit.findMany.mockResolvedValue(flatUnits);

      const tree = await service.getTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Root');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].name).toBe('Child 1');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].name).toBe('Grandchild');
    });

    it('should handle multi-root hierarchies', async () => {
        const flatUnits = [
            { id: '1', name: 'Root A', parentId: null },
            { id: '2', name: 'Root B', parentId: null },
        ];
        mockPrismaService.auditableUnit.findMany.mockResolvedValue(flatUnits);
  
        const tree = await service.getTree();
        expect(tree).toHaveLength(2);
    });
  });

  describe('createNode', () => {
    it('should create node and parse auditCycle', async () => {
      const createData = { name: 'New Unit', auditCycle: '3 yıl', isActive: true };
      mockPrismaService.auditableUnit.create.mockResolvedValue({
          id: 'new-id',
          name: 'New Unit',
          status: 'Aktif',
          auditCycle: 3
      });

      const result = await service.createNode(createData);

      expect(mockPrismaService.auditableUnit.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
              name: 'New Unit',
              auditCycle: 3,
              status: 'Aktif'
          })
      });
      expect(result.id).toBe('new-id');
    });

    it('should handle missing optional fields', async () => {
        mockPrismaService.auditableUnit.create.mockResolvedValue({ id: 'id', name: 'N', status: 'Aktif' });
        await service.createNode({ name: 'N' });
        expect(mockPrismaService.auditableUnit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                type: 'Birim',
                parentId: null
            })
        });
    });
  });

  describe('updateNode', () => {
    it('should update node and handle partial fields', async () => {
      mockPrismaService.auditableUnit.update.mockResolvedValue({ id: '1', name: 'Updated' });
      
      await service.updateNode('1', { name: 'Updated', isActive: false });
      
      expect(mockPrismaService.auditableUnit.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: expect.objectContaining({
              name: 'Updated',
              status: 'Pasif'
          })
      });
    });

    it('should ignore undefined fields', async () => {
        mockPrismaService.auditableUnit.update.mockResolvedValue({ id: '1' });
        await service.updateNode('1', { manager: 'New Manager' });
        
        const callArgs = mockPrismaService.auditableUnit.update.mock.calls[0][0].data;
        expect(callArgs.name).toBeUndefined();
        expect(callArgs.manager).toBe('New Manager');
    });
  });

  describe('deleteNode', () => {
    it('should re-parent children and delete node', async () => {
      const nodeToDelete = { id: 'delete-me', parentId: 'parent-id' };
      mockPrismaService.auditableUnit.findUnique.mockResolvedValue(nodeToDelete);
      
      await service.deleteNode('delete-me');
      
      expect(mockPrismaService.auditableUnit.updateMany).toHaveBeenCalledWith({
          where: { parentId: 'delete-me' },
          data: { parentId: 'parent-id' }
      });
      expect(mockPrismaService.auditableUnit.delete).toHaveBeenCalledWith({
          where: { id: 'delete-me' }
      });
    });

    it('should throw error if node not found', async () => {
      mockPrismaService.auditableUnit.findUnique.mockResolvedValue(null);
      await expect(service.deleteNode('invalid')).rejects.toThrow('Birim bulunamadı');
    });
  });
});
