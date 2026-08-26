import { CustomerProfileService } from './customer-profile.service';

/**
 * Email is not an ordinary profile field: login resolves an account by it and
 * it is unique across users. These pin the rules that keep editing it from
 * pointing two accounts at one login, or from silently leaving a fresh,
 * unproven address marked as verified.
 */
describe('CustomerProfileService email changes', () => {
  const build = ({
    currentEmail = 'old@example.com',
    takenBy = null as string | null,
  } = {}) => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ email: currentEmail }),
        findFirst: jest
          .fn()
          .mockResolvedValue(takenBy ? { id: takenBy } : null),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const profileRepository = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'profile-1' }),
      update: jest.fn().mockResolvedValue({}),
    };
    const service = new CustomerProfileService(
      profileRepository as never,
      { log: jest.fn() } as never,
      prisma as never,
    );
    // getProfile() re-reads at the end; the write is what these assert on.
    jest.spyOn(service, 'getProfile').mockResolvedValue({} as never);
    return { service, prisma };
  };

  it('refuses an address already registered to another account', async () => {
    // Accepting it would leave two accounts resolving from one login.
    const { service, prisma } = build({ takenBy: 'someone-else' });

    await expect(
      service.updateProfile('user-1', { email: 'taken@example.com' }),
    ).rejects.toThrow(/already registered/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('marks a newly entered address unverified until it is confirmed', async () => {
    const { service, prisma } = build();

    await service.updateProfile('user-1', { email: 'new@example.com' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@example.com',
          isEmailVerified: false,
        }),
      }),
    );
  });

  it('normalises case and whitespace before storing or comparing', async () => {
    // '  New@Example.com ' and 'new@example.com' are the same mailbox; storing
    // both forms would let a duplicate slip past the uniqueness check.
    const { service, prisma } = build();

    await service.updateProfile('user-1', { email: '  New@Example.com ' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'new@example.com' }),
      }),
    );
  });

  it('does not reset verification when the address has not actually changed', async () => {
    // Saving the form without touching the email must not knock a verified
    // account back to unverified.
    const { service, prisma } = build({ currentEmail: 'same@example.com' });

    await service.updateProfile('user-1', {
      email: 'SAME@example.com',
      firstName: 'Vasanthi',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ isEmailVerified: false }),
      }),
    );
  });

  it('leaves the email alone when the form does not send one', async () => {
    const { service, prisma } = build();

    await service.updateProfile('user-1', { firstName: 'Vasanthi' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ email: expect.anything() }),
      }),
    );
  });
});
