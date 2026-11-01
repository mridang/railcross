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
import { Expose, Transform, Type } from 'class-transformer';
import setupView from './setup.view.js';

/**
 * The hour of day a time field names: the form's clock time on the hour
 * ("22:00") or a plain hour ("22"). Anything else, a time with minutes
 * included, comes through as NaN and fails the integer check.
 */
export function hourOf(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.trim() === '') {
    return Number.NaN;
  }
  const clock = /^(\d{1,2}):00(?::00)?$/.exec(value);
  return clock ? Number(clock[1]) : Number(value);
}

class ScheduleDto {
  // Read from the raw body: by the time `value` arrives, implicit conversion to
  // a number has already turned "22:00" into NaN.
  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    hourOf(obj['lock_time']),
  )
  @IsInt()
  @Min(0)
  @Max(23)
  @Expose({ name: 'lock_time' })
  lockTime!: number;

  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    hourOf(obj['unlock_time']),
  )
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
