import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@codegenie/serverless-express';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
  Handler,
} from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module';
import { LoggerService } from '@nestjs/common';
import { Logger } from '@aws-lambda-powertools/logger';
import expressHandlebars from 'express-handlebars';

class PowertoolsLoggerService implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  log(message: string | object, context?: string): void {
    this.logger.info(this.formatMessage(message, context));
  }

  error(message: string | object, trace?: string, context?: string): void {
    this.logger.error(this.formatMessage(message, context), { trace });
  }

  warn(message: string | object, context?: string): void {
    this.logger.warn(this.formatMessage(message, context));
  }

  debug(message: string | object, context?: string): void {
    this.logger.debug(this.formatMessage(message, context));
  }

  verbose(message: string | object, context?: string): void {
    this.logger.debug(this.formatMessage(message, context));
  }

  private formatMessage(message: string | object, context?: string): string {
    if (typeof message === 'string') {
      return context ? `${context}: ${message}` : message;
    } else {
      return JSON.stringify({ context, ...message });
    }
  }
}

let cachedServer: Handler;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    // @ts-expect-error since this cannot be empty
    expressApp.engine('handlebars', expressHandlebars());
    expressApp.set('view engine', 'handlebars');
    expressApp.set('views', './src/views');

    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: new PowertoolsLoggerService(),
      },
    );

    nestApp.enableCors();

    await nestApp.init();

    cachedServer = serverlessExpress({ app: expressApp });
  }

  return cachedServer;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>,
) => {
  const server = await bootstrap();
  return server(event, context, callback);
};
