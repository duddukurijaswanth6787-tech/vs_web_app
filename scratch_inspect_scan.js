async function main() {
  const url = 'https://api.vasanthissignature.in/api/v1';
  const loginRes = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@vasanthi.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;

  console.log('--- Scan COL1-XL ---');
  const res1 = await fetch(`${url}/pos/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ barcode: '890351069409' }),
  });
  const d1 = await res1.json();
  console.log(d1.data);

  console.log('\n--- Scan COL1-FREE-SIZE ---');
  const res2 = await fetch(`${url}/pos/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ barcode: '890903879825' }),
  });
  const d2 = await res2.json();
  console.log(d2.data);
}

main().catch(console.error);
