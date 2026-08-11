const http = require('http');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'http://localhost:4000/api/v1';

// Helper to make HTTP requests
function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`);
    const options = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

// Binary upload helper (PUT request)
function putBinary(uploadUrl, buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(uploadUrl);
    const options = {
      method: 'PUT',
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
      },
    };

    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        resolve({ statusCode: res.statusCode });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(buffer);
    req.end();
  });
}

async function main() {
  const report = [];

  const addReport = (name, method, endpoint, expected, actual, result) => {
    report.push({ name, method, endpoint, expected, actual, result });
    console.log(`[TEST] ${name} (${method} ${endpoint}): Expected ${expected}, Got ${actual} -> ${result}`);
  };

  try {
    console.log('Seeding Brand and Product dependencies if missing...');
    // Seed brand
    const brand = await prisma.brand.upsert({
      where: { slug: 'test-brand' },
      update: {},
      create: { name: 'Test Brand', slug: 'test-brand' }
    });
    // Seed product
    const product = await prisma.product.upsert({
      where: { slug: 'test-product-tagging' },
      update: {},
      create: {
        sku: 'TEST-SKU-100',
        barcode: 'TEST-BARCODE-100',
        name: 'Test Saree',
        slug: 'test-product-tagging',
        brandId: brand.id,
        basePrice: 1500,
        type: 'READYMADE',
        status: 'ACTIVE',
        isPublished: true,
      }
    });
    console.log(`Seeded Brand: ${brand.name}, Product: ${product.name}`);

    console.log('Starting Phase 4 API and S3 upload tests...');

    // 1. Authenticate
    console.log('Logging in as seeded admin...');
    const loginRes = await request('POST', '/auth/login', {}, {
      email: 'admin@vasanthidesigners.com',
      password: 'admin123',
    });

    if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.data.accessToken;
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    console.log('Authentication Successful.');

    // 2. Test CMS pages
    console.log('Testing CMS pages...');
    const pagePayload = {
      title: 'TEST CMS Page title',
      slug: 'test-cms-page-slug-' + Date.now(),
      content: '<p>HTML content here for test</p>',
      metaTitle: 'TEST SEO Meta Title',
      metaDescription: 'TEST SEO Description',
    };
    const createPageRes = await request('POST', '/cms/pages', authHeaders, pagePayload);
    if (createPageRes.statusCode !== 201) console.log('Create Page Validation Fail:', JSON.stringify(createPageRes.data));
    addReport(
      'Create CMS Page', 'POST', '/cms/pages', 201, createPageRes.statusCode,
      createPageRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    const getPagesRes = await request('GET', '/cms/pages', authHeaders);
    addReport(
      'Get CMS Pages List', 'GET', '/cms/pages', 200, getPagesRes.statusCode,
      getPagesRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 3. Test CMS sections
    console.log('Testing CMS sections...');
    const sectionPayload = {
      name: 'TEST Section Name',
      slug: 'test-section-slug-' + Date.now(),
      type: 'HERO',
      content: { heroTitle: 'Hello World', backgroundUrl: 'http://example.com' },
      displayOrder: 1,
      isActive: true,
    };
    const createSecRes = await request('POST', '/cms/sections', authHeaders, sectionPayload);
    if (createSecRes.statusCode !== 201) console.log('Create Section Validation Fail:', JSON.stringify(createSecRes.data));
    addReport(
      'Create CMS Section', 'POST', '/cms/sections', 201, createSecRes.statusCode,
      createSecRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    const getSecsRes = await request('GET', '/cms/sections', authHeaders);
    addReport(
      'Get CMS Sections List', 'GET', '/cms/sections', 200, getSecsRes.statusCode,
      getSecsRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 4. Test Banners
    console.log('Testing Banners...');
    const bannerPayload = {
      title: 'TEST Banner Title',
      imageUrl: 'http://localhost:9099/vasanthi-designers-dev-bucket/products/banners/images/test.png',
      linkUrl: 'https://vasanthidesigners.com/sale',
      placement: 'home_carousel',
      displayOrder: 2,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(), // +1 day
      isActive: true,
    };
    const createBannerRes = await request('POST', '/cms/banners', authHeaders, bannerPayload);
    if (createBannerRes.statusCode !== 201) console.log('Create Banner Validation Fail:', JSON.stringify(createBannerRes.data));
    addReport(
      'Create Banner', 'POST', '/cms/banners', 201, createBannerRes.statusCode,
      createBannerRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    const getBannersRes = await request('GET', '/cms/banners', authHeaders);
    addReport(
      'Get Banners List', 'GET', '/cms/banners', 200, getBannersRes.statusCode,
      getBannersRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 5. Test FAQs
    console.log('Testing FAQs...');
    const faqPayload = {
      question: 'TEST What is your return policy?',
      answer: 'You can return any product within 30 days.',
      category: 'RETURNS',
      displayOrder: 1,
      isActive: true,
    };
    const createFaqRes = await request('POST', '/faqs', authHeaders, faqPayload);
    addReport(
      'Create FAQ', 'POST', '/faqs', 201, createFaqRes.statusCode,
      createFaqRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    const getFaqsRes = await request('GET', '/faqs', authHeaders);
    addReport(
      'Get FAQs List', 'GET', '/faqs', 200, getFaqsRes.statusCode,
      getFaqsRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 6. Test Coupons
    console.log('Testing Coupons...');
    const couponPayload = {
      code: 'TESTCOUPON' + Math.floor(Math.random() * 1000),
      name: 'TEST Coupon discount',
      description: 'Get Flat 100 Off',
      type: 'FLAT',
      value: 100,
      minOrderAmount: 500,
      usageLimit: 100,
      perCustomerLimit: 1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
    };
    const createCouponRes = await request('POST', '/coupons', authHeaders, couponPayload);
    if (createCouponRes.statusCode !== 201) console.log('Create Coupon Validation Fail:', JSON.stringify(createCouponRes.data));
    addReport(
      'Create Coupon', 'POST', '/coupons', 201, createCouponRes.statusCode,
      createCouponRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    const getCouponsRes = await request('GET', '/coupons', authHeaders);
    addReport(
      'Get Coupons List', 'GET', '/coupons', 200, getCouponsRes.statusCode,
      getCouponsRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 7. Test Offers
    console.log('Testing Offers...');
    const offerPayload = {
      name: 'TEST Festive Offer',
      description: '10% discount on clothing items',
      type: 'FESTIVAL',
      value: 10,
      minOrderAmount: 1000,
      priority: 1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
    };
    const createOfferRes = await request('POST', '/offers', authHeaders, offerPayload);
    if (createOfferRes.statusCode !== 200 && createOfferRes.statusCode !== 201) console.log('Create Offer Validation Fail:', JSON.stringify(createOfferRes.data));
    addReport(
      'Create Offer', 'POST', '/offers', 200, createOfferRes.statusCode,
      (createOfferRes.statusCode === 200 || createOfferRes.statusCode === 201) ? 'PASS' : 'FAIL'
    );

    const getOffersRes = await request('GET', '/offers', authHeaders);
    addReport(
      'Get Offers List', 'GET', '/offers', 200, getOffersRes.statusCode,
      getOffersRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 8. Test Campaigns
    console.log('Testing Campaigns...');
    const campaignPayload = {
      name: 'TEST Campaign Newsletter',
      description: 'Monthly marketing newsletter for users',
      type: 'Newsletter',
      channel: 'EMAIL',
      subject: 'New Arrivals are Here!',
      content: 'Check out our new fashion launches online!',
      audience: ['VIP', 'New Users'],
    };
    const createCampRes = await request('POST', '/campaigns', authHeaders, campaignPayload);
    addReport(
      'Create Campaign', 'POST', '/campaigns', 201, createCampRes.statusCode,
      createCampRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    const getCampsRes = await request('GET', '/campaigns', authHeaders);
    addReport(
      'Get Campaigns List', 'GET', '/campaigns', 200, getCampsRes.statusCode,
      getCampsRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 9. Test Reviews List
    console.log('Testing Reviews moderation...');
    const getReviewsRes = await request('GET', '/reviews', authHeaders);
    addReport(
      'Get Reviews List', 'GET', '/reviews', 200, getReviewsRes.statusCode,
      getReviewsRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    // 10. Test Social post creation & S3 Upload Lifecycle & Tagging
    console.log('Testing Social Post Upload Lifecycle...');
    const socialPayload = {
      contentType: 'POST',
      caption: 'Diwali silk collection test post #silk #saree',
      hashtags: ['#silk', '#saree'],
      visibility: 'PUBLIC',
      allowComments: true,
    };
    const createPostRes = await request('POST', '/admin/social/posts', authHeaders, socialPayload);
    addReport(
      'Create Social Post Draft', 'POST', '/admin/social/posts', 201, createPostRes.statusCode,
      createPostRes.statusCode === 201 ? 'PASS' : 'FAIL'
    );

    if (createPostRes.statusCode === 201) {
      const postId = createPostRes.data.data.id;

      // Tag product coordinate tagging
      console.log('Tagging seeded product on post...');
      const tagRes = await request('PUT', `/admin/social/posts/${postId}/products`, authHeaders, [
        {
          productId: product.id,
          tagX: 55.4,
          tagY: 72.8,
          label: 'Exclusive Saree Label',
        }
      ]);
      addReport(
        'Product Tagging on Post', 'PUT', `/admin/social/posts/${postId}/products`, 200, tagRes.statusCode,
        tagRes.statusCode === 200 ? 'PASS' : 'FAIL'
      );

      // S3 Sign post media
      const signRes = await request('POST', `/admin/social/posts/${postId}/upload-url`, authHeaders, {
        mediaType: 'IMAGE',
        extension: 'png',
      });
      addReport(
        'Generate Social Post Presigned URL', 'POST', `/admin/social/posts/${postId}/upload-url`, 200, signRes.statusCode,
        signRes.statusCode === 200 ? 'PASS' : 'FAIL'
      );

      if (signRes.statusCode === 200) {
        const uploadUrl = signRes.data.data.uploadUrl;
        const publicUrl = signRes.data.data.url;

        // Perform Binary PUT to mock S3 emulator on port 9099
        const testImageBuffer = Buffer.from('fake-png-binary-content-test');
        const uploadPutRes = await putBinary(uploadUrl, testImageBuffer, 'image/png');
        addReport(
          'Binary PUT to Mock S3', 'PUT', uploadUrl.split('?')[0], 200, uploadPutRes.statusCode,
          uploadPutRes.statusCode === 200 ? 'PASS' : 'FAIL'
        );

        // Verify the object exists via a HEAD request on the emulator port 9099
        const headUrl = publicUrl;
        const headRes = await request('HEAD', headUrl);
        addReport(
          'Verify Object Exists in S3', 'HEAD', headUrl, 200, headRes.statusCode,
          headRes.statusCode === 200 ? 'PASS' : 'FAIL'
        );

        // Add media attachment reference via backend API
        const attachRes = await request('PUT', `/admin/social/posts/${postId}/media`, authHeaders, [
          {
            mediaType: 'IMAGE',
            s3Key: signRes.data.data.s3Key,
            url: publicUrl.replace('localhost:9099', 's3.ap-south-1.amazonaws.com'),
            mimeType: 'image/png',
            size: testImageBuffer.length,
            displayOrder: 1,
          }
        ]);
        if (attachRes.statusCode !== 200) console.log('Attach Media Validation Fail:', JSON.stringify(attachRes.data));
        addReport(
          'Attach Media Reference to Post', 'PUT', `/admin/social/posts/${postId}/media`, 200, attachRes.statusCode,
          attachRes.statusCode === 200 ? 'PASS' : 'FAIL'
        );

        // Verify PostgreSQL does not store binary/base64
        const savedPost = await prisma.socialPost.findUnique({
          where: { id: postId },
          include: { media: true }
        });
        const hasBinary = savedPost.media.some(m => m.url.startsWith('data:') || m.url.length > 5000);
        addReport(
          'Database binary/base64 check', 'Prisma', 'socialPost', 'no binary',
          hasBinary ? 'found base64/binary' : 'clean URL only',
          !hasBinary ? 'PASS' : 'FAIL'
        );

        // Publish post so customers can see/report it
        console.log('Publishing social post...');
        const publishRes = await request('PUT', `/admin/social/posts/${postId}/status`, authHeaders, {
          action: 'PUBLISH',
        });
        addReport(
          'Publish Social Post', 'PUT', `/admin/social/posts/${postId}/status`, 200, publishRes.statusCode,
          publishRes.statusCode === 200 ? 'PASS' : 'FAIL'
        );

        // Test filing safety report (customer action)
        console.log('Filing safety report...');
        const reportRes = await request('POST', `/social/posts/${postId}/report`, authHeaders, {
          reason: 'SPAM',
          description: 'Spam post test report'
        });
        if (reportRes.statusCode !== 201) console.log('Submit Report Validation Fail:', JSON.stringify(reportRes.data));
        addReport(
          'Submit Post Safety Report', 'POST', `/social/posts/${postId}/report`, 201, reportRes.statusCode,
          reportRes.statusCode === 201 ? 'PASS' : 'FAIL'
        );

        if (reportRes.statusCode === 201) {
          const reportId = reportRes.data.data.id;
          
          // Test resolving moderation report
          console.log('Resolving moderation report...');
          const resolveReportRes = await request('PUT', `/admin/social/reports/${reportId}`, authHeaders, {
            action: 'DISMISS',
            resolution: 'Test resolved dismissal'
          });
          addReport(
            'Admin Resolve Moderation Report', 'PUT', `/admin/social/reports/${reportId}`, 200, resolveReportRes.statusCode,
            resolveReportRes.statusCode === 200 ? 'PASS' : 'FAIL'
          );
        }
      }
    }

    // 11. Test Banner S3 Upload Lifecycle
    console.log('Testing Banner S3 Upload Lifecycle...');
    const bannerSignRes = await request('POST', '/media/upload-url', authHeaders, {
      productId: 'banners',
      mediaType: 'IMAGE',
      extension: 'png',
    });
    addReport(
      'Generate Banner Presigned URL', 'POST', '/media/upload-url', 200, bannerSignRes.statusCode,
      bannerSignRes.statusCode === 200 ? 'PASS' : 'FAIL'
    );

    if (bannerSignRes.statusCode === 200) {
      const uploadUrl = bannerSignRes.data.data.uploadUrl;
      const publicUrl = bannerSignRes.data.data.url;

      // PUT to S3
      const testImageBuffer = Buffer.from('fake-banner-png-content');
      const uploadPutRes = await putBinary(uploadUrl, testImageBuffer, 'image/png');
      addReport(
        'Banner Binary PUT to S3', 'PUT', uploadUrl.split('?')[0], 200, uploadPutRes.statusCode,
        uploadPutRes.statusCode === 200 ? 'PASS' : 'FAIL'
      );

      // Verify object exists
      const headRes = await request('HEAD', publicUrl);
      addReport(
        'Verify Banner Object in S3', 'HEAD', publicUrl, 200, headRes.statusCode,
        headRes.statusCode === 200 ? 'PASS' : 'FAIL'
      );
    }

    // Write results report file
    fs.writeFileSync('C:\\Users\\jashwanth\\Downloads\\Demo_vs_e_13-07\\backend\\test-results.json', JSON.stringify(report, null, 2));
    console.log('Tests Completed. Results written to test-results.json.');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
