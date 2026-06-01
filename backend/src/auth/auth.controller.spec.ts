import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerModule } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({ access_token: 'at' }),
    refreshToken: jest.fn().mockResolvedValue({ access_token: 'new-at' }),
    logout: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60, limit: 10 }]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const loginDto = { username: 'test', password: 'password' };
      await controller.login(loginDto);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken', async () => {
      const dto = { refresh_token: 'rt' };
      await controller.refresh(dto);
      expect(service.refreshToken).toHaveBeenCalledWith('rt');
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const req = { user: { id: 'u1' } };
      await controller.logout(req, { refresh_token: 'rt' });
      expect(service.logout).toHaveBeenCalledWith('u1', 'rt');
    });
  });

  describe('me', () => {
    it('should return user profile from request', () => {
      const req = { user: { id: 'u1', username: 'test', roles: ['ADMIN'], permissions: [] } };
      const result = controller.getProfile(req);
      expect(result).toEqual(req.user);
    });
  });
});
