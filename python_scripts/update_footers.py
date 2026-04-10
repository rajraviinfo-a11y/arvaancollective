import os
import re

FOOTER = """<footer class="site-footer">
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
</footer>"""

store_path = r"c:/Users/ravi.raj/.gemini/antigravity/scratch/store"
files = [
    "index.html", 
    "shop.html", 
    "product.html", 
    "checkout.html", 
    "account.html", 
    "orders.html", 
    "wishlist.html", 
    "categories.html"
]

for filename in files:
    filepath = os.path.join(store_path, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Regex to replace everything from <footer to </footer>
        new_content = re.sub(r'<footer.*?</footer>', FOOTER, content, flags=re.DOTALL)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated footer in {filename}")
