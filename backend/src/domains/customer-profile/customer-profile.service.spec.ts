import { CustomerProfileService } from './customer-profile.service';

/**
 * A CustomerProfile row is created lazily, not at signup: the Google and OTP
 * paths create a User without one. getProfile always tolerated that by
 * creating on demand, but updateProfile threw 'Profile not found' (422), so a
 * customer who signed up with Google and went straight to editing their
 * details could never save.
 */
describe('CustomerProfileService profile auto-creation', () => {
  const buildService = ({ profileExists }: { profileExists: boolean }) => {
    const existing = { id: 'profile-1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() };
    const created = { ...existing, id: 'profile-created' };

    // Stateful, because updateProfile re-reads via getProfile once it is done:
    // a mock that returned null forever would report a second create that a
    // real table never performs.
    let stored: typeof existing | null = profileExists ? existing : null;
    const repo = {
      findByUserId: jest.fn().mockImplementation(async () => stored),
      create: jest.fn().mockImplementation(async () => {
        stored = created;
        return created;
      }),
      update: jest.fn().mockImplementation(async () => stored),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const prisma = { user: { update: jest.fn().mockResolvedValue({}) } };

    const service = new CustomerProfileService(
      repo as never,
      audit as never,
      prisma as never,
    );
    return { service, repo, audit, prisma };
  };

  it('creates the profile on update when the user has none, instead of throwing', async () => {
    const { service, repo } = buildService({ profileExists: false });

    await expect(
      service.updateProfile('user-1', { firstName: 'Duddukuri', lastName: 'Jaswanth' }),
    ).resolves.toBeDefined();

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith('profile-created', expect.anything());
  });

  it('reuses the existing profile rather than creating a duplicate', async () => {
    const { service, repo } = buildService({ profileExists: true });

    await service.updateProfile('user-1', { phone: '07660922416' });

    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('profile-1', { phone: '07660922416' });
  });

  it('writes firstName/lastName to the User row, not the profile row', async () => {
    // They live on User; the profile row has no such columns, so they must be
    // split out of the payload before it reaches profileRepository.update.
    const { service, repo, prisma } = buildService({ profileExists: true });

    await service.updateProfile('user-1', { firstName: 'Duddukuri', phone: '07660922416' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { firstName: 'Duddukuri' },
    });
    expect(repo.update).toHaveBeenCalledWith('profile-1', { phone: '07660922416' });
  });

  it('leaves the User row alone when no name fields are supplied', async () => {
    const { service, prisma } = buildService({ profileExists: true });

    await service.updateProfile('user-1', { phone: '07660922416' });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
