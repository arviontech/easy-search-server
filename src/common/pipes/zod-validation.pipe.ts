/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError, ZodObject } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodObject<any>) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
