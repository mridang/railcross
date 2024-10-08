import ProtectionService from './services/railcross/protection.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ClsService } from 'nestjs-cls';
import { AsyncLocalStorage } from 'node:async_hooks';
import { BetterLogger } from '@mridang/nestjs-defaults/dist/logger';

exports.lock = async ({
  installation_id,
  repo_name,
}: {
  repo_name: string;
  installation_id: number;
}) => {
  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new BetterLogger(new ClsService(new AsyncLocalStorage())),
  });
  const protectionService = nestApp.get(ProtectionService);
  await protectionService.toggleProtection(repo_name, installation_id, true);
};

exports.unlock = async ({
  installation_id,
  repo_name,
}: {
  repo_name: string;
  installation_id: number;
}) => {
  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new BetterLogger(new ClsService(new AsyncLocalStorage())),
  });
  const protectionService = nestApp.get(ProtectionService);
  await protectionService.toggleProtection(repo_name, installation_id, false);
};
