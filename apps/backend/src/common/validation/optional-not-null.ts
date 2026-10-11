import { ValidateIf } from 'class-validator';

/** Like @IsOptional(), but only skips validation for `undefined`; `null` still reaches the field's validators and is rejected. */
export function IsOptionalNotNull(): PropertyDecorator {
  return ValidateIf((_object, value) => value !== undefined);
}
