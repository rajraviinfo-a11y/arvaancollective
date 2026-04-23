import re, os

firebase_prefix = '  <!-- Firebase SDK -->\n  <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>\n  <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>\n  <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>\n  <script src="../js/firebase-config.js"></script>\n'

firebase_sync = '  <script src="../js/firebase-sync.js"></script>'

files = [
  'admin/settings.html', 'admin/pages.html', 'admin/homepage.html', 'admin/filters.html',
  'store/index.html', 'store/shop.html', 'store/product.html', 'store/account.html',
  'store/checkout.html', 'store/orders.html', 'store/wishlist.html', 'store/about.html',
  'store/contact.html', 'store/categories.html', 'store/faq.html', 'store/pages.html',
  'store/electronics.html', 'store/privacy-policy.html', 'store/return-policy.html',
  'store/shipping-policy.html', 'store/terms-of-service.html',
  'seller/seller.html', 'seller/seller-reviews.html', 'seller/seller-settings.html',
  'seller/seller-products.html', 'seller/seller-promotions.html', 'seller/seller-financials.html',
  'seller/seller-orders.html', 'seller/seller-analytics.html', 'seller/seller-dashboard.html',
  'seller/register.html'
]

count = 0
for f in files:
    if not os.path.exists(f):
        print('SKIP (missing): ' + f)
        continue
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    if 'firebase-app-compat' in content:
        print('ALREADY DONE: ' + f)
        continue

    pattern = r'(<script src="\.\./js/data\.js[^"]*"></script>)'

    def replacer(m):
        return firebase_prefix + m.group(1) + '\n' + firebase_sync

    new_content, n = re.subn(pattern, replacer, content, count=1)
    if n == 0:
        print('NO MATCH: ' + f)
        continue
    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(new_content)
    count += 1
    print('PATCHED: ' + f)

print('Done! Patched ' + str(count) + ' files.')
