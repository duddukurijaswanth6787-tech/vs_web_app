async function main() {
  const url = 'https://api.vasanthissignature.in/api/v1';
  const loginRes = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vasanthi.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;

  for (const code of ['890351069409', 'COL1-XL']) {
    console.log(`\n=== Scanning: ${code} ===`);
    const scanRes = await fetch(`${url}/pos/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ barcode: code }),
    });
    console.log(`Status: ${scanRes.status}`);
    const scanData = await scanRes.json();
    console.log(scanData.data?.productName, '| SKU:', scanData.data?.sku, '| Barcode:', scanData.data?.barcode, '| Price: ₹' + scanData.data?.price);
  }
}

main().catch(console.error);
