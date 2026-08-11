import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateProductDto } from './products.types';

describe('CreateProductDto', () => {
  it('accepts status and visibility (frontend payload shape)', () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test Kurta',
      brandId: '00000000-0000-4000-8000-000000000001',
      basePrice: 100,
      status: 'DRAFT',
      visibility: 'VISIBLE',
    });
    const errors = validateSync(dto);
    expect(errors).toEqual([]);
  });

  it('still rejects unknown properties', () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test Kurta',
      brandId: '00000000-0000-4000-8000-000000000001',
      basePrice: 100,
      bogusField: 'x',
    });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.map((e) => e.property)).toContain('bogusField');
  });
});
