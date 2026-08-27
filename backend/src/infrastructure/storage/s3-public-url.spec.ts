import { ConfigService } from '@nestjs/config';
import { S3StorageProvider } from './s3-storage.provider';

/**
 * A wrong public URL is stored on every uploaded file, so it is only noticed
 * later, as images that will not load. The region-less
 * `<bucket>.s3.amazonaws.com` form this used to emit does not resolve for
 * regions introduced after 2019 -- ap-south-2, which this shop runs in,
 * among them.
 */
describe('S3StorageProvider.getPublicUrl', () => {
  const provider = (settings: Record<string, unknown>) => {
    const config = {
      get: <T>(key: string, fallback?: T) =>
        (key in settings ? settings[key] : fallback) as T,
    } as ConfigService;
    return new S3StorageProvider(config);
  };

  it('addresses the bucket regionally', () => {
    const p = provider({
      'app.storage.s3.bucket': 'shop-bucket',
      'app.storage.s3.region': 'ap-south-2',
    });

    expect(p.getPublicUrl('images/a.png')).toBe(
      'https://shop-bucket.s3.ap-south-2.amazonaws.com/images/a.png',
    );
  });

  it('never emits the legacy region-less host', () => {
    const p = provider({
      'app.storage.s3.bucket': 'shop-bucket',
      'app.storage.s3.region': 'ap-south-2',
    });

    expect(p.getPublicUrl('a.png')).not.toBe(
      'https://shop-bucket.s3.amazonaws.com/a.png',
    );
  });

  it('uses a custom endpoint in virtual-hosted style', () => {
    const p = provider({
      'app.storage.s3.bucket': 'shop-bucket',
      'app.storage.s3.region': 'ap-south-2',
      'app.storage.s3.endpoint': 'https://s3.ap-south-2.amazonaws.com',
    });

    expect(p.getPublicUrl('images/a.png')).toBe(
      'https://shop-bucket.s3.ap-south-2.amazonaws.com/images/a.png',
    );
  });

  it('uses path style when the provider is configured for it', () => {
    // MinIO and other S3-compatible servers need the bucket in the path.
    const p = provider({
      'app.storage.s3.bucket': 'shop-bucket',
      'app.storage.s3.region': 'us-east-1',
      'app.storage.s3.endpoint': 'https://minio.example.com/',
      'app.storage.s3.forcePathStyle': true,
    });

    expect(p.getPublicUrl('a.png')).toBe(
      'https://minio.example.com/shop-bucket/a.png',
    );
  });

  it('prefers an explicitly configured public URL, such as a CDN', () => {
    const p = provider({
      'app.storage.s3.bucket': 'shop-bucket',
      'app.storage.s3.region': 'ap-south-2',
      'app.storage.s3.publicUrl': 'https://cdn.example.com',
    });

    expect(p.getPublicUrl('a.png')).toBe('https://cdn.example.com/a.png');
  });
});
