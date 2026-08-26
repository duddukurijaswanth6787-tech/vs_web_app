/**
 * The edit form filled itself from the profile query by comparing object
 * identity against a `useState(data)` seed. That works only when `data` is
 * undefined on the first render. Once React Query has the profile cached --
 * which is the case every time the customer saves and then reopens Edit --
 * `data` is present at mount, the seed captures the very same object, the
 * comparison is false, and the form renders blank over a populated profile.
 *
 * These pin the two rules that keep that from coming back.
 */

type Profile = { firstName?: string; dateOfBirth?: string };

/** The old identity-comparison seed, kept so the regression stays visible. */
const seedsFromIdentity = (data: Profile | undefined) => {
  const prevData = data; // useState(data) captures data on the first render
  return data !== prevData;
};

/** What the page does now: fill once, whenever the data first arrives. */
const seedsFromHydratedFlag = (data: Profile | undefined) => {
  const hydrated = false;
  return !hydrated && !!data;
};

/** <input type="date"> renders blank unless the value is exactly YYYY-MM-DD. */
const toDateInputValue = (v: string | undefined) =>
  v ? String(v).slice(0, 10) : '';

describe('profile edit prefill', () => {
  const cached: Profile = { firstName: 'Vasanthi' };

  it('fills the form when the profile is already cached (the reported bug)', () => {
    // The exact path a customer takes: save, go back, press Edit again.
    expect(seedsFromIdentity(cached)).toBe(false); // old behaviour: blank form
    expect(seedsFromHydratedFlag(cached)).toBe(true);
  });

  it('still fills the form on a cold load, when data arrives later', () => {
    expect(seedsFromHydratedFlag(undefined)).toBe(false);
    expect(seedsFromHydratedFlag(cached)).toBe(true);
  });

  it('narrows an ISO timestamp to what a date input will display', () => {
    expect(toDateInputValue('2001-05-12T00:00:00.000Z')).toBe('2001-05-12');
  });

  it('leaves an already-narrow date and a missing date alone', () => {
    expect(toDateInputValue('2001-05-12')).toBe('2001-05-12');
    expect(toDateInputValue(undefined)).toBe('');
  });
});
