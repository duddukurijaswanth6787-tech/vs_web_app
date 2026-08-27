import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GlobalExceptionMapper } from './index';

/**
 * The status the mapper produces is what the client actually receives, so a
 * wrong one here is a wrong one everywhere. Two failures this pins down:
 * a routing 404 was being reported as a database fault, and every unhandled
 * crash came back 422 -- a client error -- so no 5xx alarm ever fired.
 */
describe('GlobalExceptionMapper', () => {
  it('keeps the status the thrower chose', () => {
    const cases: [Error, HttpStatus][] = [
      [new BadRequestException('bad'), HttpStatus.BAD_REQUEST],
      [new ConflictException('clash'), HttpStatus.CONFLICT],
      [new ServiceUnavailableException('down'), HttpStatus.SERVICE_UNAVAILABLE],
      [
        new InternalServerErrorException('boom'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      ],
    ];

    for (const [thrown, expected] of cases) {
      expect(GlobalExceptionMapper.map(thrown).getStatus()).toBe(expected);
    }
  });

  it('does not call a missing route a database error', () => {
    const mapped = GlobalExceptionMapper.map(
      new NotFoundException('Cannot GET /wp-login.php'),
    );

    expect(mapped.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(mapped.name).toBe('ResourceNotFoundException');
    expect(mapped.errorCode).toBe('RESOURCE_NOT_FOUND');
  });

  it('reports an unhandled crash as 500, not as a client error', () => {
    const mapped = GlobalExceptionMapper.map(
      new TypeError('x is not a function'),
    );

    expect(mapped.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mapped.name).toBe('InternalServerException');
  });

  it('reports a thrown non-Error as 500 too', () => {
    expect(GlobalExceptionMapper.map('just a string').getStatus()).toBe(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('still turns class-validator messages into a 400', () => {
    const mapped = GlobalExceptionMapper.map(
      new BadRequestException({ message: ['name must be a string'] }),
    );

    expect(mapped.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(mapped.errorCode).toBe('INVALID_INPUT');
  });
});
