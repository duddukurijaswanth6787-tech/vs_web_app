import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateMediaDto, UpdateMediaDto } from './media.types';

describe('Media DTO URL validation', () => {
  it('accepts app-generated proxy URLs (localhost host)', () => {
    const dto = plainToInstance(CreateMediaDto, {
      productId: '00000000-0000-4000-8000-000000000001',
      mediaType: 'IMAGE',
      url: 'http://localhost:4000/api/v1/storage/products/x/y.png',
    });
    expect(validateSync(dto)).toEqual([]);
  });

  it('accepts production public URLs', () => {
    const dto = plainToInstance(CreateMediaDto, {
      productId: '00000000-0000-4000-8000-000000000001',
      mediaType: 'IMAGE',
      url: 'https://vasanthi-designers-dev-bucket.s3.ap-south-2.amazonaws.com/x/y.png',
    });
    expect(validateSync(dto)).toEqual([]);
  });

  it('still rejects non-URL strings', () => {
    const dto = plainToInstance(CreateMediaDto, {
      productId: '00000000-0000-4000-8000-000000000001',
      mediaType: 'IMAGE',
      url: 'ChatGPT Image Aug 1.png',
    });
    const errors = validateSync(dto);
    expect(errors.map((e) => e.property)).toContain('url');
  });

  it('still rejects missing url', () => {
    const dto = plainToInstance(UpdateMediaDto, { url: '' });
    const errors = validateSync(dto);
    expect(errors.map((e) => e.property)).toContain('url');
  });
});
