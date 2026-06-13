import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Inject,
  Post,
  Redirect,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsSupportedTimeZone } from './timezone.validator.js';
import RailcrossService from './railcross.service.js';
import type { Request } from '@mridang/nestjs-defaults';
import { Octokit } from '@octokit/rest';
import { OctokitImpl } from '../github/octokit/types.js';
import { Expose, Type } from 'class-transformer';
import setupView from './setup.view.js';

class ScheduleDto {
  @IsInt()
  @Min(0)
  @Max(23)
  @Expose({ name: 'lock_time' })
  lockTime!: number;

  @IsInt()
  @Min(0)
  @Max(23)
  @Expose({ name: 'unlock_time' })
  unlockTime!: number;

  @IsSupportedTimeZone({ message: 'Timezone is not valid' })
  @Expose({ name: 'timezone' })
  timezone!: string;

  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @IsOptional()
  @Expose({ name: 'repo_ids' })
  repoIds!: number[];
}

@Controller('app')
export class SetupController {
  constructor(
    private readonly railcrossService: RailcrossService,
    @Inject(OctokitImpl)
    private readonly octokitFn: (
      accessTokenOrInstallationId: number | string,
    ) => Octokit,
  ) {
    //
  }

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async showSetup(@Req() request: Request & { user: { accessToken: string } }) {
    if (!request.user.accessToken) {
      throw new UnauthorizedException('Unable to deduce allowed installations');
    } else {
      const octokit = this.octokitFn(request.user.accessToken);
      const repoSchedules = await this.railcrossService.listSchedules(octokit);

      return setupView(repoSchedules);
    }
  }

  @Post('setup')
  @Redirect('/app', HttpStatus.FOUND)
  async updateSetup(
    @Body() scheduleDto: ScheduleDto,
    @Req()
    request: Request & {
      user: { accessToken: string };
    },
  ) {
    if (!request.user.accessToken) {
      throw new UnauthorizedException('Unable to deduce allowed installations');
    } else {
      const octokit = this.octokitFn(request.user.accessToken);

      await this.railcrossService.updateSchedules(
        octokit,
        scheduleDto.repoIds,
        scheduleDto.lockTime,
        scheduleDto.unlockTime,
        scheduleDto.timezone,
      );
    }
  }

  @Post('reset')
  @Redirect('/app', HttpStatus.FOUND)
  async reset(@Req() request: Request & { user: { accessToken: string } }) {
    if (!request.user.accessToken) {
      throw new UnauthorizedException('Unable to deduce allowed installations');
    } else {
      const octokit = this.octokitFn(request.user.accessToken);

      await this.railcrossService.resetSchedules(octokit);
    }
  }
}
