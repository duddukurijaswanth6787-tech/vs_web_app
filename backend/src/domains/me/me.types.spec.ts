import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateMeDto } from './me.types';

/**
 * PUT /me runs through the global ValidationPipe configured in main.ts with
 * whitelist + forbidNonWhitelisted, so any field absent from UpdateMeDto is
 * rejected outright rather than ignored.
 *
 * CustomerProfileService.updateProfile() reads firstName/lastName off the dto
 * and writes them to the User row. When they were missing from this DTO the
 * request was refused before the service ran, and the profile form could not
 * save a name -- with an error naming fields that plainly existed elsewhere in
 * the codebase. This pins the DTO to what the service actually consumes.
 */
const validateAsPipe = (payload: Record<string, unknown>) =>
  validateSync(plainToInstance(UpdateMeDto, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('UpdateMeDto', () => {
  it('accepts the fields the profile edit form submits', () => {
    expect(
      validateAsPipe({
        firstName: 'Jagadeep',
        lastName: 'Chowdary',
        phone: '7659034198',
        gender: 'MALE',
        dateOfBirth: '2004-01-12',
      }),
    ).toHaveLength(0);
  });

  it('accepts firstName/lastName on their own', () => {
    // The regression that reached production: these two were the only
    // rejected properties once the rest of the form was trimmed down.
    expect(validateAsPipe({ firstName: 'A', lastName: 'B' })).toHaveLength(0);
  });

  it('still rejects a property no endpoint defines', () => {
    const errors = validateAsPipe({ firstName: 'A', notARealField: 'x' });
    expect(errors).not.toHaveLength(0);
    expect(errors.map((e) => e.property)).toContain('notARealField');
  });
});
