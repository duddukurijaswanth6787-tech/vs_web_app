import 'reflect-metadata';
import { validateSync } from 'class-validator';
import {
  IsPhoneNumberCustom,
  IsPincodeCustom,
  IsHsnCodeCustom,
  IsMoneyCustom,
  IsPositiveIntCustom,
  IsRequiredStringCustom,
  IsGSTCustom,
} from './decorators.validation';

/**
 * These are the rules every DTO in the app relies on. A regression here would
 * either let bad data through (e.g. accepting a 3-digit "phone") or reject
 * legitimate data. Every branch of every validator has one runnable check.
 */
describe('custom validators', () => {
  class PhoneDto {
    @IsPhoneNumberCustom()
    phone!: string;
  }
  const phoneOf = (v: unknown) => {
    const d = new PhoneDto();
    (d as unknown as { phone: unknown }).phone = v;
    return validateSync(d).length === 0;
  };

  describe('IsPhoneNumberCustom', () => {
    it('accepts a plain 10-digit Indian mobile starting 6-9', () => {
      expect(phoneOf('9876543210')).toBe(true);
      expect(phoneOf('7000000000')).toBe(true);
    });
    it('accepts a +91 prefix and strips it', () => {
      expect(phoneOf('+919876543210')).toBe(true);
      expect(phoneOf('919876543210')).toBe(true);
    });
    it('accepts spaces and hyphens the user typed', () => {
      expect(phoneOf('98765-43210')).toBe(true);
      expect(phoneOf('98765 43210')).toBe(true);
    });
    it('rejects a landline (starts 2-5)', () => {
      expect(phoneOf('2234567890')).toBe(false);
    });
    it('rejects too few digits', () => {
      expect(phoneOf('9876543')).toBe(false);
      // The old rule accepted "123" as an "international" number.
      expect(phoneOf('123')).toBe(false);
    });
    it('rejects too many digits', () => {
      expect(phoneOf('98765432100')).toBe(false);
    });
    it('rejects a non-string', () => {
      expect(phoneOf(9876543210)).toBe(false);
      expect(phoneOf(null)).toBe(false);
    });
  });

  class PincodeDto {
    @IsPincodeCustom()
    pincode!: string;
  }
  const pincodeOf = (v: unknown) => {
    const d = new PincodeDto();
    (d as unknown as { pincode: unknown }).pincode = v;
    return validateSync(d).length === 0;
  };

  describe('IsPincodeCustom', () => {
    it('accepts a 6-digit PIN', () => {
      expect(pincodeOf('500034')).toBe(true);
      expect(pincodeOf('110001')).toBe(true);
    });
    it('rejects a leading zero (Indian PINs never start with 0)', () => {
      expect(pincodeOf('050034')).toBe(false);
    });
    it('rejects wrong length or non-numeric', () => {
      expect(pincodeOf('50003')).toBe(false);
      expect(pincodeOf('5000345')).toBe(false);
      expect(pincodeOf('5000A4')).toBe(false);
    });
  });

  class HsnDto {
    @IsHsnCodeCustom()
    hsn!: string;
  }
  const hsnOf = (v: unknown) => {
    const d = new HsnDto();
    (d as unknown as { hsn: unknown }).hsn = v;
    return validateSync(d).length === 0;
  };

  describe('IsHsnCodeCustom', () => {
    it('accepts 4 to 8 digit HSN', () => {
      expect(hsnOf('6204')).toBe(true);
      expect(hsnOf('62044200')).toBe(true);
    });
    it('rejects HSN with letters or wrong length', () => {
      expect(hsnOf('620')).toBe(false);
      expect(hsnOf('620442001')).toBe(false);
      expect(hsnOf('620X')).toBe(false);
    });
  });

  class MoneyDto {
    @IsMoneyCustom()
    amount!: number;
  }
  const moneyOf = (v: unknown) => {
    const d = new MoneyDto();
    (d as unknown as { amount: unknown }).amount = v;
    return validateSync(d).length === 0;
  };

  describe('IsMoneyCustom', () => {
    it('accepts zero and positive amounts', () => {
      expect(moneyOf(0)).toBe(true);
      expect(moneyOf(1299.5)).toBe(true);
      expect(moneyOf(100)).toBe(true);
    });
    it('rejects negative values (a refund is never a negative rupee)', () => {
      expect(moneyOf(-1)).toBe(false);
      expect(moneyOf(-0.01)).toBe(false);
    });
    it('rejects more than two decimals', () => {
      expect(moneyOf(1.234)).toBe(false);
    });
  });

  class PositiveIntDto {
    @IsPositiveIntCustom()
    n!: number;
  }
  const posIntOf = (v: unknown) => {
    const d = new PositiveIntDto();
    (d as unknown as { n: unknown }).n = v;
    return validateSync(d).length === 0;
  };

  describe('IsPositiveIntCustom', () => {
    it('accepts 1 and above', () => {
      expect(posIntOf(1)).toBe(true);
      expect(posIntOf(9999)).toBe(true);
    });
    it('rejects zero and negatives (a cart line of 0 pieces is not a line)', () => {
      expect(posIntOf(0)).toBe(false);
      expect(posIntOf(-1)).toBe(false);
    });
    it('rejects fractions', () => {
      expect(posIntOf(1.5)).toBe(false);
    });
  });

  class RequiredStringDto {
    @IsRequiredStringCustom(1, 20)
    field!: string;
  }
  const requiredOf = (v: unknown) => {
    const d = new RequiredStringDto();
    (d as unknown as { field: unknown }).field = v;
    return validateSync(d).length === 0;
  };

  describe('IsRequiredStringCustom', () => {
    it('accepts real text', () => {
      expect(requiredOf('anything')).toBe(true);
    });
    it('rejects the empty and whitespace-only strings that IsString lets through', () => {
      expect(requiredOf('')).toBe(false);
      expect(requiredOf('   ')).toBe(false);
    });
    it('honours the length window', () => {
      expect(requiredOf('x'.repeat(21))).toBe(false);
    });
  });

  class GstinDto {
    @IsGSTCustom()
    gstin!: string;
  }
  const gstinOf = (v: unknown) => {
    const d = new GstinDto();
    (d as unknown as { gstin: unknown }).gstin = v;
    return validateSync(d).length === 0;
  };

  describe('IsGSTCustom', () => {
    it('accepts a valid 15-char GSTIN', () => {
      expect(gstinOf('36ABCDE1234F1Z5')).toBe(true);
    });
    it('rejects wrong length or shape', () => {
      expect(gstinOf('36ABCDE1234F1Z')).toBe(false);
      expect(gstinOf('random-string')).toBe(false);
    });
  });
});
