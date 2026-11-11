/**
 * @file Class-validator decorator that accepts only IANA time zone names known to the runtime.
 */
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Creates a property decorator that requires the value to be a supported IANA time zone.
 *
 * The supported names come from `Intl.supportedValuesOf('timeZone')` at validation
 * time, so the list always matches the running runtime.
 * @param validationOptions - Optional class-validator options, such as a custom message.
 * @returns A property decorator to apply to a DTO field.
 * @example
 * ```ts
 * class ScheduleDto {
 *   @IsSupportedTimeZone({ message: 'Timezone is not valid' })
 *   timezone!: string;
 * }
 * ```
 */
// eslint-disable-next-line sonarjs/function-name -- mirrors the PascalCase class-validator decorator style
export function IsSupportedTimeZone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsSupportedTimeZone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          const timeZones = Intl.supportedValuesOf('timeZone');
          return timeZones.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid timezone`;
        },
      },
    });
  };
}
