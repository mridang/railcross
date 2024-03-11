import { NestExpressApplication } from '@nestjs/platform-express';
import { CustomHttpExceptionFilter } from './errorpage.exception.filter';
import { join } from 'path';
import { handlebars } from 'hbs';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

export default function configure(nestApp: NestExpressApplication) {
  nestApp.useGlobalFilters(new CustomHttpExceptionFilter());
  nestApp.setViewEngine('hbs');
  nestApp.setBaseViewsDir(join(__dirname, '..', 'views'));
  nestApp.engine(
    'hbs',
    (
      filePath: string,
      options: Record<string, object>,
      callback: (err: Error | null, rendered?: string) => void,
    ) => {
      const template = handlebars.compile(fs.readFileSync(filePath, 'utf8'));
      const result = template(options);
      callback(null, result);
    },
  );

  nestApp.use(cookieParser());
  nestApp.use(helmet());
  nestApp.enableCors();
  nestApp.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        console.log(messages);
        return new BadRequestException(messages);
      },
    }),
  );

  return nestApp;
}
