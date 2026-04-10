import os

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | Arvaan Collective</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/store.css?v=5.1">
  <style>
    .policy-content-card {{ background: #fff; border: 1px solid var(--clr-border); border-radius: var(--radius-lg); padding: var(--space-10); margin-bottom: 60px; box-shadow: var(--shadow-sm); }}
    .policy-content {{ color: var(--clr-text-2); font-size: 1.05rem; line-height: 1.8; }}
    .policy-content h2 {{ font-family: var(--font-heading); font-size: 1.8rem; margin: 40px 0 20px; color: var(--clr-text); }}
    .policy-content h3 {{ font-size: 1.2rem; font-weight: 700; margin: 30px 0 15px; color: var(--clr-text); }}
    .policy-content ul {{ list-style-type: none; padding-left: 20px; margin-bottom: 20px; }}
    .policy-content li {{ margin-bottom: 10px; position: relative; }}
    .policy-content li::before {{ content: "•"; color: var(--clr-primary); position: absolute; left: -15px; font-weight: bold; }}
  </style>
</head>
<body class="policy-page-body">

<!-- ══ ANNOUNCEMENT BAR ══ -->
<div class="announce-bar" id="announce-bar">
  <div class="announce-inner">
    <span class="announce-item active">🚚 Free Delivery on orders above ₹999</span>
    <span class="announce-item">🎁 Use code <strong>WELCOME10</strong> for 10% off your first order</span>
    <span class="announce-item">↩️ 30-Day Easy Returns — Zero Hassle</span>
  </div>
  <button class="announce-close" onclick="this.closest('.announce-bar').style.display='none'">✕</button>
</div>

<!-- ══ NAVBAR ══ -->
<header class="site-header" id="site-header">
  <nav class="navbar" id="navbar">
    <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
    <a href="index.html" class="navbar-brand">
      <div class="brand-icon">✦</div>
      <span>Arvaan <em>Collective</em></span>
    </a>

    <div class="navbar-center">
      <div class="search-box-nav" id="nav-search-box-trigger">
        <span class="search-icon-nav">🔍</span>
        <input type="text" id="nav-search-input" placeholder="Search curated realms..." autocomplete="off">
        <div class="search-results-dropdown hidden" id="search-results-dropdown"></div>
      </div>
    </div>

    <div class="navbar-actions">
      <select id="currency-select" class="currency-select">
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
      </select>

      <div class="dropdown" id="nav-user-menu">
        <button class="nav-action-btn" id="user-dropdown-toggle">
          <div class="avatar avatar-sm" id="nav-avatar-initials">U</div>
          <span class="nav-btn-label" id="nav-user-name-short">Me</span>
        </button>
        <div class="dropdown-menu" id="user-dropdown-menu">
          <div class="user-dropdown-header">
            <div class="user-name" id="nav-user-name">User</div>
            <div class="user-email" id="nav-user-email">user@email.com</div>
          </div>
          <a href="account.html" class="dropdown-item">👤 My Account</a>
          <a href="orders.html" class="dropdown-item">📦 My Orders</a>
          <a href="wishlist.html" class="dropdown-item">❤️ Wishlist</a>
          <div class="dropdown-divider"></div>
          <a href="../seller/seller.html" class="dropdown-item">🏪 Seller Dashboard</a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" id="logout-btn" style="color:var(--clr-danger)">🚪 Sign Out</button>
        </div>
      </div>

      <a href="wishlist.html" class="nav-action-btn" title="Wishlist">
        <span>❤️</span>
        <span class="nav-btn-label">Wishlist</span>
      </a>

      <button class="nav-action-btn cart-nav-btn" id="cart-btn">
        <span>🛒</span>
        <span class="cart-badge hidden" id="cart-count">0</span>
      </button>
    </div>
  </nav>

  <!-- ══ CATEGORY NAV BAR ══ -->
  <div class="cat-navbar" id="cat-navbar">
    <div class="cat-navbar-inner">
      <a href="shop.html" class="cat-nav-link">All</a>
      <a href="shop.html?cat=Electronics" class="cat-nav-link">📱 Electronics</a>
      <a href="shop.html?cat=Fashion" class="cat-nav-link">👗 Fashion</a>
      <a href="shop.html?cat=Furniture" class="cat-nav-link">🛋️ Furniture</a>
      <a href="shop.html?cat=Kitchen" class="cat-nav-link">☕ Kitchen</a>
      <a href="shop.html?cat=Wellness" class="cat-nav-link">🌿 Wellness</a>
      <a href="shop.html?cat=Travel" class="cat-nav-link">✈️ Travel</a>
      <a href="shop.html?cat=Home+Decor" class="cat-nav-link">🏠 Home Decor</a>
      <a href="shop.html?filter=deals" class="cat-nav-link deals-link">🔥 Deals</a>
      <a href="shop.html?filter=new" class="cat-nav-link new-link">✨ New</a>
    </div>
  </div>
</header>

<main class="store-main">
  <div class="page-container" style="padding-top:var(--space-10)">
    <div class="section-title-row" style="margin-bottom:var(--space-8); justify-content:center; text-align:center">
      <div>
        <div class="section-eyebrow">Our Commitment to You</div>
        <h1 class="section-heading">{title}</h1>
        <p class="text-muted" style="max-width:600px; margin:16px auto 0">Last Updated: April 2026</p>
      </div>
    </div>

    <div class="policy-content-card">
      <div class="policy-content">
        {content}
      </div>
    </div>
  </div>
</main>

<!-- ══ FOOTER ══ -->
<footer class="site-footer">
  <div class="page-container">
    <div class="footer-grid">
      <div class="footer-brand-col">
        <div class="footer-brand">✦ Arvaan <em>Collective</em></div>
        <p class="footer-tagline">India's trusted destination for premium curated products. Genuine brands. Best prices. Fastest delivery.</p>
        <div class="footer-social">
          <a href="#" class="social-btn" title="Twitter">𝕏</a>
          <a href="#" class="social-btn" title="Instagram">📸</a>
          <a href="#" class="social-btn" title="Facebook">📘</a>
          <a href="#" class="social-btn" title="YouTube">▶️</a>
        </div>
      </div>
      <div class="footer-links-col">
        <div class="footer-col-heading">Shop</div>
        <ul class="footer-links">
          <li><a href="shop.html">All Products</a></li>
          <li><a href="shop.html?filter=deals">Today's Deals</a></li>
          <li><a href="shop.html?filter=new">New Arrivals</a></li>
          <li><a href="shop.html?cat=Electronics">Electronics</a></li>
          <li><a href="shop.html?cat=Fashion">Fashion</a></li>
          <li><a href="shop.html?cat=Wellness">Wellness</a></li>
        </ul>
      </div>
      <div class="footer-links-col">
        <div class="footer-col-heading">My Account</div>
        <ul class="footer-links">
          <li><a href="account.html">My Profile</a></li>
          <li><a href="orders.html">My Orders</a></li>
          <li><a href="wishlist.html">Wishlist</a></li>
          <li><a href="checkout.html">Checkout</a></li>
          <li><a href="../seller/seller.html">Seller Dashboard</a></li>
          <li><a href="../seller/register.html">Become a Seller</a></li>
        </ul>
      </div>
      <div class="footer-links-col">
        <div class="footer-col-heading">Help & Policies</div>
        <ul class="footer-links">
          <li><a href="shipping-policy.html">Shipping & Delivery</a></li>
          <li><a href="return-policy.html">Return & Refund Policy</a></li>
          <li><a href="orders.html">Track Your Order</a></li>
          <li><a href="faq.html">FAQs</a></li>
          <li><a href="privacy-policy.html">Privacy Policy</a></li>
          <li><a href="terms-of-service.html">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Arvaan Collective. All Rights Reserved.</span>
      <div class="payment-icons">
        <span class="pay-icon" style="opacity:0.8">💳 Secure Payment</span>
        <span class="pay-icon" style="opacity:0.8">🔒 256-bit Encryption</span>
      </div>
    </div>
  </div>
</footer>

<!-- ══ CART DRAWER ══ -->
<div class="cart-drawer-overlay" id="cart-overlay">
  <div class="cart-drawer">
    <div class="cart-header">
      <span>🛒 Your Cart (<span id="cart-count-drawer">0</span> items)</span>
      <button id="cart-close" class="modal-close">✕</button>
    </div>
    <div class="cart-items" id="cart-items"></div>
    <div class="cart-footer">
      <div class="cart-totals"><div class="cart-total-row grand"><span>Total</span><span id="cart-total">₹0</span></div></div>
      <a href="checkout.html" class="btn-checkout">Proceed to Checkout →</a>
    </div>
  </div>
</div>

<div id="toast-container"></div>

<script src="../js/data.js?v=3"></script>
<script src="../js/auth.js"></script>
<script src="../js/store.js?v=5"></script>
</body>
</html>
"""

PAGES = {
    "shipping-policy.html": {
        "title": "Shipping & Delivery Policy",
        "content": """
<h2>Our Shipping Philosophy</h2>
<p>At Arvaan Collective, we understand that anticipation is part of the luxury experience. We partner with India's premier logistics providers to ensure your curated items arrive safely and swiftly.</p>

<h3>Delivery Options & Timelines</h3>
<ul>
  <li><strong>Standard Delivery (Free above ₹999):</strong> 3-5 business days depending on location.</li>
  <li><strong>Express Delivery (₹149):</strong> 1-2 business days for metro cities.</li>
  <li><strong>Same Day Courier (₹299):</strong> Available for select pin codes in Mumbai, Delhi NCR, and Bengaluru for orders placed before 12 PM.</li>
</ul>

<h3>Order Tracking</h3>
<p>Once your order is dispatched, you will receive an email and SMS with a tracking link. You can also monitor your shipment directly from your <a href="orders.html" style="color:var(--clr-primary);font-weight:bold;text-decoration:none">My Orders</a> dashboard.</p>

<h3>Packaging</h3>
<p>Every Arvaan Collective order is packed with the utmost care. We utilize secure, eco-conscious materials that reflect our commitment to the environment without compromising on safety. Gift wrapping is available at checkout for an added touch of elegance.</p>
"""
    },
    "return-policy.html": {
        "title": "Return & Refund Policy",
        "content": """
<h2>Returns Made Effortless</h2>
<p>If your curation is not quite what you expected, we offer a seamless, zero-hassle return process within 30 days of delivery.</p>

<h3>Conditions for Return</h3>
<ul>
  <li>Items must be unused, in re-sellable condition, and in their original packaging.</li>
  <li>Tags, protective films, and authenticity cards (if applicable) must be intact.</li>
  <li>Certain categories like intimate apparel, perishable goods, and personalized custom items are non-returnable.</li>
</ul>

<h3>How to Initiate a Return</h3>
<p>Navigate to your <a href="orders.html" style="color:var(--clr-primary);font-weight:bold;text-decoration:none">My Orders</a> section, locate the item, and select "Request Return." Our logistics partner will arrange a complimentary pickup from your address within 24-48 hours.</p>

<h3>Refund Processing</h3>
<p>Once the returned item passes our quality inspection, your refund will be processed within 5-7 business days to your original payment method. For Cash on Delivery orders, you will be asked to provide bank details or UPI ID for a direct transfer.</p>
"""
    },
    "faq.html": {
         "title": "Frequently Asked Questions",
         "content": """
<h2>How can we assist you?</h2>
<p>Find quick answers to common questions about shopping with Arvaan Collective.</p>

<h3>Orders & Payments</h3>
<p><strong>What payment methods do you accept?</strong><br>We accept all major Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), and Cash on Delivery (for eligible pin codes).</p>
<p><strong>Can I modify an order after placing it?</strong><br>Orders can be cancelled or modified within 2 hours of placement. Please visit the Orders section in your account.</p>

<h3>Shipping & Returns</h3>
<p><strong>Do you ship internationally?</strong><br>Currently, Arvaan Collective curates and ships exclusively within India. We plan to expand globally in late 2027.</p>
<p><strong>How long does a refund take?</strong><br>Following quality check approval at our facility, refunds typically reflect in your bank account within 5-7 business days.</p>

<h3>Account & Prestige Points</h3>
<p><strong>How does the Prestige Rewards program work?</strong><br>For every unit spent, you earn 1 Prestige Point. Points define your tier (Silver, Gold, Platinum) and unlock exclusive early-access sales and priority support. Points are valid for 12 months from the date of earning.</p>
"""
    },
    "privacy-policy.html": {
         "title": "Privacy Policy",
         "content": """
<h2>Your Privacy is Paramount</h2>
<p>Arvaan Collective ("we," "our," "us") is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information when you use our platform.</p>

<h3>Information We Collect</h3>
<ul>
  <li><strong>Account Information:</strong> Name, email address, password, and contact details.</li>
  <li><strong>Transaction Data:</strong> Payment details, shipping addresses, and purchase history.</li>
  <li><strong>Technical Data:</strong> IP address, browser type, device information, and interaction metrics.</li>
</ul>

<h3>How We Use It</h3>
<p>We utilize this data to process your orders, provide customer support, personalize your shopping experience, and inform you of relevant curations. We never sell your personal data to third parties.</p>

<h3>Data Security</h3>
<p>We implement state-of-the-art 256-bit SSL encryption and strict internal access protocols to ensure your data remains secure from unauthorized access.</p>
"""
    },
    "terms-of-service.html": {
         "title": "Terms of Service",
         "content": """
<h2>Terms and Conditions of Use</h2>
<p>Welcome to Arvaan Collective. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.</p>

<h3>Account Responsibilities</h3>
<p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>

<h3>Product Information</h3>
<p>While we strive for extreme accuracy, Arvaan Collective does not warrant that product descriptions, pricing, or other content is entirely error-free. In the event of a listing error, we reserve the right to cancel associated orders.</p>

<h3>Intellectual Property</h3>
<p>All content included on this site, such as text, graphics, logos, images, and software, is the property of Arvaan Collective or its suppliers and protected by international copyright laws.</p>
"""
    }
}

store_path = r"c:/Users/ravi.raj/.gemini/antigravity/scratch/store"

for filename, data in PAGES.items():
    filepath = os.path.join(store_path, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(TEMPLATE.format(title=data["title"], content=data["content"]))

print("Generated all 5 static policy pages successfully!")
