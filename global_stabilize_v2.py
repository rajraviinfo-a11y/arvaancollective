import os
import re

brand_html = '<a href="index.html" class="navbar-brand">'
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

# Broad repair map for all corrupted sequences identified
repair_map = {
    'â‚¹': '₹', 'ðŸšš': '🚚', 'ðŸŽ': '🎁', 'â†©ï¸': '↩️', 'âœ•': '✕', 'âœ¦': '✦',
    'â˜°': '☰', 'ðŸ”': '🔍', 'ðŸ‘¤': '👤', 'ðŸ“¦': '📦', 'â ¤ï¸': '❤️', 'ðŸ ª': '🏪',
    'ðŸšª': '🚪', 'ðŸ›’': '🛒', 'â• â• ': '══', 'â€¦': '…', 'â€”': '—', 'â˜…': '★',
    'ðŸ“¸': '📸', 'ðŸ“˜': '📘', 'â–¶ï¸': '▶️', 'âš¡': '⚡', 'âœ…': '✓', 'ðŸ †': '🏆',
    'âœ¨': '✨', '✉️ï¸': '✉️', 'ðŸ“§': '📧', 'Ã—': '×', '🎁‰': '⭐', '🔍¥': '🔥', 'â†’': '→',
    'Â·': '·'
}

def clean_html(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # 1. Force remove any version of the cat-navbar (even corrupted ones)
        # We target the id and class more broadly
        content = re.sub(r'(?s)<!--.*?NAV BAR.*?<div class="cat-navbar".*?</div>\s*</div>', '', content)
        content = re.sub(r'(?s)<div class="cat-navbar".*?</div>\s*</div>', '', content)

        # 2. Add dropdown if missing or if only a corrupted one exists
        # If we see corrupted dropdown tags, we'll fix them via repair_map anyway, 
        # but let's ensure we don't have duplicates.
        if 'id="nav-categories-dropdown"' not in content:
            brand_pat = r'(<a href="index\.html" class="navbar-brand">.*?Arvaan <em>Collective</em></span>\s*</a>)'
            if re.search(brand_pat, content, re.DOTALL):
                content = re.sub(brand_pat, r'\1' + dropdown_html, content, flags=re.DOTALL)
        
        # 3. Repair all corrupted characters globally
        for k, v in repair_map.items():
            content = content.replace(k, v)

        # 4. Remove duplicate dropdowns if any (safety)
        if content.count('id="nav-categories-dropdown"') > 1:
            parts = content.split('id="nav-categories-dropdown"')
            content = parts[0] + 'id="nav-categories-dropdown"' + parts[1] + "".join(parts[2:])

        # 5. Fix script paths and versions for core navigation
        content = re.sub(r'src="(?:/js/|\.\./js/)store\.js\?v=\d+"', 'src="../js/store.js?v=15"', content)
        content = re.sub(r'src="(?:/js/|\.\./js/)auth\.js\?v=\d+"', 'src="../js/auth.js?v=3"', content)
        content = re.sub(r'src="(?:/js/|\.\./js/)data\.js\?v=\d+"', 'src="../js/data.js?v=6"', content)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"STABILIZED: {file_path}")
    except Exception as e:
        print(f"ERROR on {file_path}: {e}")

# Run globally
for root, dirs, files in os.walk('store'):
    for f in files:
        if f.endswith('.html'):
            clean_html(os.path.join(root, f))
