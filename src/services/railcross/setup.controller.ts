/**
 * @file HTTP routes for the schedule setup page and its update and reset forms.
 */
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
 * Reads the hour of day that a time field names.
 *
 * The form's clock time on the hour ("22:00") or a plain hour ("22") is accepted.
 * Anything else, a time with minutes included, comes through as NaN and fails the
 * integer check.
 * @param value - The raw form value of the time field.
 * @returns The hour as a number, NaN for an empty or unsupported value, or the value unchanged when it is not a string.
 * @example
 * ```ts
 * hourOf('22:00'); // 22
 * hourOf('7'); // 7
 * hourOf('07:30'); // NaN
 * ```
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

/**
 * The form fields that set the lock, unlock, time zone and repository choices.
 *
 * The time fields are read from the raw body: by the time `value` arrives,
 * implicit conversion to a number has already turned "22:00" into NaN.
 */
class ScheduleDto {
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
    if (request.user.accessToken) {
      const octokit = this.octokitFn(request.user.accessToken);
      const repoSchedules = await this.railcrossService.listSchedules(octokit);

      return setupView(repoSchedules);
    } else {
      throw new UnauthorizedException('Unable to deduce allowed installations');
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
    if (request.user.accessToken) {
      const octokit = this.octokitFn(request.user.accessToken);

      await this.railcrossService.updateSchedules(
        octokit,
        scheduleDto.repoIds,
        scheduleDto.lockTime,
        scheduleDto.unlockTime,
        scheduleDto.timezone,
      );
    } else {
      throw new UnauthorizedException('Unable to deduce allowed installations');
    }
  }

  @Post('reset')
  @Redirect('/app', HttpStatus.FOUND)
  async reset(@Req() request: Request & { user: { accessToken: string } }) {
    if (request.user.accessToken) {
      const octokit = this.octokitFn(request.user.accessToken);

      await this.railcrossService.resetSchedules(octokit);
    } else {
      throw new UnauthorizedException('Unable to deduce allowed installations');
    }
  }
}
