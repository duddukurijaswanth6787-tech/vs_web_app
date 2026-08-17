-- Seeds the public policy pages required for payment-gateway (Razorpay) business
-- verification: Terms of Service, Privacy Policy, Shipping & Delivery Policy,
-- About Us, and a new standalone Cancellation & Refund Policy page (previously
-- only a short paragraph buried inside Terms, with no dedicated public page).
--
-- Content is inserted as real cms_pages rows (status PUBLISHED) so it is
-- editable by admin/super_admin from Storefront > Content > Pages going
-- forward, instead of being hardcoded in frontend source. ON CONFLICT DO
-- NOTHING keeps this idempotent if a page with the same slug already exists
-- (e.g. an admin already created one manually).

INSERT INTO "cms_pages" ("id", "title", "slug", "content", "metaTitle", "metaDescription", "status", "createdAt", "updatedAt")
VALUES ('5fbd2183-a558-4cca-82e9-ccc38126259a', 'Terms of Service', 'terms', '<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">1. Account Registration &amp; Social Sign-In (OAuth 2.0)</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">To place orders or access premium customer features (such as wishlist synchronization and order tracking), you may register an account manually or use Google OAuth 2.0 Social Login.</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">You are responsible for maintaining the confidentiality of your account login credentials.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">When signing in via Google OAuth 2.0, you warrant that the Google Account belongs to you and is active.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Vasanthi''s Signature reserves the right to terminate accounts that violate security protocols or participate in fraudulent activity.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">2. Product Orders, Pricing &amp; Taxes</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">All prices listed on this website are in Indian Rupees (INR, &#8377;) and include applicable GST taxes unless stated otherwise.</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Product availability and prices are subject to change without prior notice.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">In the rare event of a pricing error or stock inaccuracy, we reserve the right to cancel or adjust the order with a full refund.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Payments can be made via Credit/Debit Cards, NetBanking, UPI, or Cash on Delivery (COD) where eligible.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">3. Shipping, Logistics &amp; Delivery</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">We partner with reputed courier logistics providers to ensure safe and timely delivery of your luxury ethnic apparel.</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Standard delivery takes between 3 to 7 business days depending on customer pincode location across India.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Real-time tracking AWB numbers are provided via SMS and email upon order dispatch.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">4. Returns, Exchanges &amp; Refunds</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Customer satisfaction is our priority. If you receive a damaged or wrong product, you may request a return or exchange within <strong>7 days of delivery</strong> through your Account Orders dashboard. See our full <a href="/cancellation-refund-policy" style="color:#800020;font-weight:700;text-decoration:underline">Cancellation &amp; Refund Policy</a> for details.</p>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Items must be unused, unwashed, with all original brand tags attached. Approved refunds are credited to the original payment method or wallet within 5 to 7 business days.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">5. Intellectual Property Rights</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">All trademarks, product designs, brand logos, high-resolution imagery, and website content displayed on Vasanthi''s Signature are the exclusive property of Vasanthi''s Signature. Reproduction or unauthorized commercial use is strictly prohibited.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">6. Governing Law &amp; Jurisdiction</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">These Terms of Service and any separate agreements shall be governed by and construed in accordance with the laws of India, subject to the exclusive jurisdiction of the courts in India.</p>

<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:20px;margin-top:24px">
  <h3 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:15px;font-weight:700;margin:20px 0 8px">Questions About Terms of Service?</h3>
  <p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Store: Vasanthi''s Signature<br/>
  Website: <a href="https://vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">https://vasanthissignature.in</a><br/>
  Support Email: <a href="mailto:support@vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">support@vasanthissignature.in</a></p>
</div>', 'Terms of Service | Vasanthi''s Signature', 'Terms and conditions for using Vasanthi''s Signature - website usage, orders, payments, and customer responsibilities.', 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "cms_pages" ("id", "title", "slug", "content", "metaTitle", "metaDescription", "status", "createdAt", "updatedAt")
VALUES ('a396407f-2669-4b0b-b8e8-97e8c81c18e1', 'Privacy Policy', 'privacy', '<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:20px;margin-top:24px">
  <h3 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:15px;font-weight:700;margin:20px 0 8px">Google OAuth 2.0 &amp; Social Sign-In Data Commitment</h3>
  <p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">When you use "Continue with Google" to log into Vasanthi''s Signature, we only access basic account identity details (your primary email address, full name, and avatar image). We never store your Google passwords, access your private Gmail messages, or sell Google user data to third-party advertisers.</p>
</div>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">1. Information We Collect</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">We collect information to provide better services to all our customers, fulfill orders, process payments, and improve your shopping experience.</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Account &amp; Contact Information:</strong> Full name, phone number, email address, shipping and billing address.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Single Sign-On (OAuth 2.0):</strong> Email address, public profile name, and profile picture ID provided via Google OAuth 2.0 authentication.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Order &amp; Transaction History:</strong> Purchased items, transaction IDs, payment methods (handled securely via Razorpay), and delivery address history.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Technical Data:</strong> IP address, device operating system, browser type, and cookie identifiers for session management.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">2. How We Use Google User Data (Google OAuth 2.0)</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Our application uses Google API Services to allow fast, 1-click customer authentication. Our use and transfer of information received from Google APIs adhere to the Google API Service User Data Policy, including the Limited Use requirements.</p>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Google OAuth data is used only to create and manage your customer account, send order receipts, shipment notifications, and customer support communications, and provide personalized wishlist and loyalty reward tracking. We do not share, transfer, or sell your Google User Data to any advertising networks, data brokers, or third parties. You may revoke access at any time through your Google Security Settings.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">3. Payment Processing &amp; Financial Security</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">All online payment transactions (Credit Cards, Debit Cards, NetBanking, and UPI) are processed through PCI-DSS Level 1 compliant payment gateways (Razorpay). Vasanthi''s Signature does NOT store or record card numbers, CVVs, or NetBanking passwords on our servers. All credit card details are encrypted using 256-bit SSL encryption provided by our payment gateway partners.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">4. Cookies &amp; Local Storage</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">We use session cookies and browser LocalStorage (e.g., guest cart and wishlist tokens) to remember items in your shopping bag, maintain active sessions, and provide seamless page navigation. You can control or disable cookies through your web browser settings.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">5. Data Deletion &amp; Customer Rights</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Under applicable Indian privacy regulations and international data standards, you have the right to access, update, or request permanent deletion of your personal data. To request account deletion or data removal, please contact our privacy officer. Upon verification, all customer data will be permanently purged within 30 business days.</p>

<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:20px;margin-top:24px">
  <h3 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:15px;font-weight:700;margin:20px 0 8px">Contact Our Data Governance Team</h3>
  <p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Store: Vasanthi''s Signature<br/>
  Website: <a href="https://vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">https://vasanthissignature.in</a><br/>
  Support Email: <a href="mailto:support@vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">support@vasanthissignature.in</a></p>
</div>', 'Privacy Policy | Vasanthi''s Signature', 'How Vasanthi''s Signature collects, uses, and protects your personal and payment-related data.', 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "cms_pages" ("id", "title", "slug", "content", "metaTitle", "metaDescription", "status", "createdAt", "updatedAt")
VALUES ('338b0b60-b207-47fb-9511-d80375090f52', 'Shipping & Delivery Policy', 'shipping', '<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">We deliver luxury sarees and bridal wear safely to your doorstep across India and over 50 international destinations using premier courier partners like DTDC, DHL, and FedEx.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Domestic Shipping (India)</h2>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Ready-to-Ship Items:</strong> Dispatched within 24-48 hours. Delivered in 3-5 business days.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Pre-Order / Custom Blouse:</strong> Dispatched within 7-10 business days.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Shipping Cost:</strong> FREE standard shipping on domestic orders above &#8377;2,999.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">International Shipping</h2>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Delivery Timeline:</strong> 5-8 business days via DHL / FedEx Express.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Customs &amp; Duties:</strong> Import duties or local taxes (if applicable) are paid directly by the recipient upon arrival.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px"><strong>Order Tracking:</strong> Real-time live AWB tracking links sent via email &amp; SMS.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Delays &amp; Exceptions</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Delivery timelines may be extended during festive seasons, severe weather, or courier network disruptions beyond our control. We will notify you by email/SMS of any significant delay to your order.</p>', 'Shipping & Delivery Policy | Vasanthi''s Signature', 'Delivery areas, shipping charges, estimated delivery time, and how order tracking works.', 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "cms_pages" ("id", "title", "slug", "content", "metaTitle", "metaDescription", "status", "createdAt", "updatedAt")
VALUES ('d384109a-d647-41e8-a8ff-c9711d4cfbd5', 'About Us', 'about', '<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Established in 2018, Vasanthi''s Signature represents the pinnacle of South Indian heritage weaving, regal zardosi embroidery, and timeless bridal couture.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Artisanal Heritage</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Every saree and lehenga is handcrafted by master artisans using traditional looms, real zari threads, and pure mulberry silk.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Uncompromising Quality</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Silk Mark certified pure silks and rigorously inspected couture garments designed to be treasured across generations.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">Bespoke Bridal Atelier</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Custom color matching, tailored hand-embroidery, and personalized styling consultations for brides across the globe.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">The Craft &amp; Legacy</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">At Vasanthi''s Signature, we believe sarees are more than just garments - they are hand-woven tapestries of culture, love, and celebration. From classic Kanchipuram weaves to modern designer organza, our collections bridge classical royal aesthetics with modern elegance.</p>', 'About Us | Vasanthi''s Signature', 'Vasanthi''s Signature - haute couture sarees, bridal wear, and luxury ethnic fashion since 2018.', 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "cms_pages" ("id", "title", "slug", "content", "metaTitle", "metaDescription", "status", "createdAt", "updatedAt")
VALUES ('9d6a0989-0f2f-495c-93a4-9c116b8dd8c5', 'Cancellation & Refund Policy', 'cancellation-refund-policy', '<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">1. Order Cancellation</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">You may cancel an order free of charge as long as it has not yet been dispatched. Once an order has shipped, it can no longer be cancelled and instead falls under our Returns &amp; Exchanges process below.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">2. Returns &amp; Exchanges</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">If you receive a damaged, defective, or wrong product, you may request a return or exchange within <strong>7 days of delivery</strong> through your Account &gt; Orders dashboard.</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Items must be unused, unwashed, and returned with all original brand tags and packaging attached.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Custom-tailored, altered, or made-to-order blouses/garments are not eligible for return unless received damaged or defective.</li>
<li style="font-size:13px;line-height:1.7;color:#262626;margin-bottom:6px">Our team reviews each return request and will confirm eligibility and pickup arrangements by email/SMS.</li>
</ul>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">3. Refund Process &amp; Timeline</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Once a returned item is received and inspected, approved refunds are credited to the original payment method (or store wallet, where applicable) within <strong>5 to 7 business days</strong>. Orders paid via Cash on Delivery are refunded via bank transfer or UPI to the details you provide.</p>
<h2 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:18px;font-weight:700;border-bottom:1px solid #ffe4e6;padding-bottom:8px;margin:24px 0 12px">4. How to Request a Cancellation or Return</h2>
<p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Log in to your account and go to <a href="/orders" style="color:#800020;font-weight:700;text-decoration:underline">My Orders</a>, select the relevant order, and choose Cancel or Request Return/Exchange. You can track the status of an existing request from <a href="/returns" style="color:#800020;font-weight:700;text-decoration:underline">My Returns</a>.</p>

<div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:20px;margin-top:24px">
  <h3 style="color:#800020;font-family:Georgia,''Times New Roman'',serif;font-size:15px;font-weight:700;margin:20px 0 8px">Need Help With an Order?</h3>
  <p style="font-size:13px;line-height:1.7;color:#404040;margin:0 0 12px">Store: Vasanthi''s Signature<br/>
  Website: <a href="https://vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">https://vasanthissignature.in</a><br/>
  Support Email: <a href="mailto:support@vasanthissignature.in" style="color:#800020;font-weight:700;text-decoration:underline">support@vasanthissignature.in</a></p>
</div>', 'Cancellation & Refund Policy | Vasanthi''s Signature', 'Order cancellation rules, return eligibility, and the refund process and timeline at Vasanthi''s Signature.', 'PUBLISHED', now(), now())
ON CONFLICT ("slug") DO NOTHING;
