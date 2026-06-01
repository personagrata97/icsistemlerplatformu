import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';
import * as fs from 'fs';

jest.mock('fs');

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockRequest = {
    url: '/test-url',
  };

  const mockArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    }),
  } as any;

  it('should handle HttpException correctly', () => {
    const status = HttpStatus.BAD_REQUEST;
    const message = 'Bad Request Message';
    const exception = new HttpException(message, status);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(status);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: status,
        message: message,
        path: mockRequest.url,
      })
    );
  });

  it('should handle generic Error as Internal Server Error', () => {
    const exception = new Error('Generic error');
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(status);
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      'error-log.txt',
      expect.stringContaining('Generic error')
    );
  });

  it('should translate 401 Unauthorized message', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    filter.catch(exception, mockArgumentsHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Oturum süreniz dolmuş veya giriş yapmadınız.',
      })
    );
  });

  it('should translate 403 Forbidden message', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockArgumentsHost);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Bu işlem için yetkiniz bulunmamaktadır.',
      })
    );
  });

  it('should handle object responses with array messages (validation errors)', () => {
    const messages = ['error 1', 'error 2'];
    const exception = new HttpException({ message: messages }, HttpStatus.BAD_REQUEST);
    
    filter.catch(exception, mockArgumentsHost);
    
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'error 1, error 2',
      })
    );
  });
});
