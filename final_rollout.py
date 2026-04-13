import os
import re

dropdown_html = """
    <!-- ══ CATEGORIES DROPDOWN ══ -->
    <div class="dropdown categories-dropdown" id="nav-categories-dropdown">
      <button class="nav-action-btn" id="categories-dropdown-toggle">
        <span>📂</span>
        <span class="nav-btn-label">Categories</span>
      </button>
      <div class="dropdown-menu" id="categories-menu">
        <!-- Categories dynamic links injected by store.js -->
      </div>
    </div>
"""

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'id="nav-categories-dropdown"' in content:
            return # Already updated

        # Add dropdown after brand link
        brand_pat = r'(<a href="index\.html" class="navbar-brand">.*?Arvaan <em>Collective</em></span>\s*</a>)'
        if re.search(brand_pat, content, re.DOTALL):
            content = re.sub(brand_pat, r'\1' + dropdown_html, content, flags=re.DOTALL)
            
            # Sync JS versions to latest (v15)
            content = re.sub(r'src="(?:/js/|\.\./js/)store\.js(?:\?v=\d+)?"', 'src="../js/store.js?v=15"', content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

# Target only the 11 identified files
targets = [
    'about.html', 'account.html', 'categories.html', 'checkout.html', 'contact.html',
    'faq.html', 'orders.html', 'privacy-policy.html', 'return-policy.html',
    'shipping-policy.html', 'terms-of-service.html'
]

for t in targets:
    process_file(os.path.join('store', t))
