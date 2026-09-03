async function main() {
  const url = 'https://api.vasanthissignature.in/api/v1';
  const loginRes = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vasanthi.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;

  console.log('Test 1: With taxPercent (extra property)...');
  const res1 = await fetch(`${url}/pos/checkout-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      items: [
        {
          productId: '7a1a81cf-fa83-451b-af36-c1f60e5b599c',
          productName: 'Floral Printed Anarkali Dress',
          variantId: '7eda94f1-d605-4b2a-9cfa-0a712efdadb0',
          sku: 'COL1-XL',
          quantity: 1,
          unitPrice: 1799,
          taxPercent: 5
        }
      ]
    })
  });
  console.log('Status 1:', res1.status, await res1.json());

  console.log('\nTest 2: Only Whitelisted Fields...');
  const res2 = await fetch(`${url}/pos/checkout-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      items: [
        {
          productId: '7a1a81cf-fa83-451b-af36-c1f60e5b599c',
          productName: 'Floral Printed Anarkali Dress',
          variantId: '7eda94f1-d605-4b2a-9cfa-0a712efdadb0',
          sku: 'COL1-XL',
          variantTitle: 'Color 1 / XL',
          quantity: 1,
          unitPrice: 1799
        }
      ]
    })
  });
  console.log('Status 2:', res2.status, await res2.json());
}

main().catch(console.error);
