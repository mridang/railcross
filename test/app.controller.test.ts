import { expect } from '@jest/globals';
import { End2EndModule } from './e2e.module';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IsEmail, IsNotEmpty } from 'class-validator';

class TestDTO {
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  message?: string;
}

@Controller()
class DynamicController {
  @Get('500')
  get500() {
    throw new Error('500 error');
  }

  @Get('error')
  getError() {
    throw new InternalServerErrorException('General error');
  }

  // Cookie test methods
  @Get('set-cookie')
  setCookie(@Res() res: Response) {
    res.cookie('test', 'NestJS').send('Cookie is set');
  }

  @Get('read-cookie')
  readCookie(@Req() req: Request) {
    return req.cookies['test'] || 'No cookie found';
  }

  @Get('cors-test')
  getCorsTest() {
    return { message: 'CORS is enabled' };
  }

  @Post('validate')
  validateTest(@Body() testDto: TestDTO) {
    return testDto;
  }
}

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
      controllers: [DynamicController],
      providers: [],
    },
  ],
});

describe('app.controller test', () => {
  beforeAll(async () => {
    await testModule.beforeAll();
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  it('/health (GET)', () => {
    return request(testModule.app.getHttpServer())
      .get('/health')
      .expect(HttpStatus.OK)
      .expect({
        status: 'ok',
        info: {
          '1.1.1.1': {
            status: 'up',
          },
        },
        error: {},
        details: {
          '1.1.1.1': {
            status: 'up',
          },
        },
      });
  });

  it('/404 (GET)', async () => {
    await request(testModule.app.getHttpServer())
      .get('/404')
      .set('Accept', 'text/html')
      .expect(HttpStatus.NOT_FOUND)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect((response) => {
        if (!response.text.includes('<title>Not Found</title>')) {
          throw new Error('Expected text not found in response');
        }
      });
  });

  it('/500 (GET)', async () => {
    await request(testModule.app.getHttpServer())
      .get('/500')
      .set('Accept', 'text/html')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect((response) => {
        if (!response.text.includes('<title>Internal server error</title>')) {
          throw new Error('Expected text not found in response');
        }
      });
  });

  it('/error (GET)', async () => {
    await request(testModule.app.getHttpServer())
      .get('/error')
      .set('Accept', 'text/html')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect((response) => {
        if (!response.text.includes('<title>Internal server error</title>')) {
          throw new Error('Expected text not found in response');
        }
      });
  });

  it('should set and read a cookie', async () => {
    await request(testModule.app.getHttpServer())
      .get('/set-cookie')
      .expect((res) => {
        expect(res.headers['set-cookie']).toContainEqual(
          expect.stringContaining(`test=NestJS`),
        );
      });

    await request(testModule.app.getHttpServer())
      .get('/read-cookie')
      .set('Cookie', [`test=NestJS`])
      .expect(HttpStatus.OK)
      .expect('NestJS');
  });

  it('should include security headers', async () => {
    await request(testModule.app.getHttpServer())
      .get('/some-path')
      .expect((res) => {
        expect(res.headers['x-dns-prefetch-control']).toBeDefined();
        expect(res.headers['x-frame-options']).toBeDefined();
      });
  });

  it('should handle request validation', async () => {
    const invalidPayload = {
      email: 'not-an-email',
    };

    const response = await request(testModule.app.getHttpServer())
      .post('/validate')
      .send(invalidPayload)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/validate',
    });
  });
});
