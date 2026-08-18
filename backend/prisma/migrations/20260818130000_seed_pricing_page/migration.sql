-- Seeds a public Pricing page (referenced during payment-gateway business
-- verification alongside Terms/Privacy/Shipping/About/Cancellation & Refund).
-- Content is a real cms_pages row (status PUBLISHED), editable by
-- admin/super_admin from Storefront > Content > Pages, matching the pattern
-- used for the other legal/info pages. ON CONFLICT DO NOTHING keeps this
-- idempotent if a "pricing" page already exists.

INSERT INTO "cms_pages" ("id", "title", "slug", "content", "metaTitle", "metaDescription", "status", "createdAt", "updatedAt")
VALUES ('caeda625-e127-4484-9216-ab1b9f290d7e', 'Pricing', 'pricing', '<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Most of our ready-to-wear pieces are priced between <strong>&#8377;500 and &#8377;2,000</strong>. All prices shown on the website are in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise.</p>

<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Typical Price Ranges by Category</h2>
<table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13px">
<thead>
<tr style="background:#fafafa">
<th style="text-align:left;padding:10px 12px;border:1px solid #e5e5e5;color:#800020;font-weight:700">Category</th>
<th style="text-align:left;padding:10px 12px;border:1px solid #e5e5e5;color:#800020;font-weight:700">Typical Range</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">Kurtis &amp; Suits</td><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">&#8377;599 &ndash; &#8377;1,499</td></tr>
<tr><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">Dresses</td><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">&#8377;699 &ndash; &#8377;1,999</td></tr>
<tr><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">Sarees (ready-to-wear)</td><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">&#8377;999 &ndash; &#8377;2,000</td></tr>
<tr><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">Lehengas</td><td style="padding:10px 12px;border:1px solid #e5e5e5;color:#262626">&#8377;1,299 &ndash; &#8377;2,000</td></tr>
</tbody>
</table>
<p style="font-size:12px;line-height:1.7;color:#737373;margin:0 0 16px">Premium handloom, zardosi-embroidered, and bridal couture pieces are individually priced and may fall outside this range &mdash; see each product page for its exact price.</p>

<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Payment Methods</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">We accept Credit/Debit Cards, NetBanking, UPI, and Cash on Delivery (COD) where eligible, processed securely via Razorpay.</p>

<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Shipping &amp; Other Charges</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Shipping charges (if any) are calculated at checkout based on delivery location and are shown before payment. See our <a href="/shipping" style="color:#800020;font-weight:700;text-decoration:underline">Shipping &amp; Delivery Policy</a> for details.</p>

<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:20px;margin-top:24px">
  <h3 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:15px;font-weight:700;margin:20px 0 8px">Questions About Pricing?</h3>
  <p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Store: Vasanthi''s Signature<br/>
  Website: <a href="https://vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">https://vasanthissignature.in</a><br/>
  Support Email: <a href="mailto:support@vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">support@vasanthissignature.in</a></p>
</div>', 'Pricing | Vasanthi''s Signature', 'Typical price ranges for Vasanthi''s Signature sarees, lehengas, kurtis and dresses, plus accepted payment methods.', 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;
