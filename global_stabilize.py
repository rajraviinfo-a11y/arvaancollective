import os
import re

# Navbar replacement components
new_dropdown = """
    <!-- ══ CATEGORIES DROPDOWN ══ -->
    <div class="dropdown categories-dropdown" id="nav-categories-dropdown">
      <button class="nav-action-btn" id="categories-dropdown-toggle">
        <span>📂</span>
        <span class="nav-btn-label">Categories</span>
      </button>
      <div class="dropdown-menu" id="categories-menu">
        <!-- Categories dynamic links injected by store.js -->
      </div>
    </div>"""

# Character repair map
repair_map = {
    'â‚¹': '₹',
    'ðŸšš': '🚚',
    'ðŸŽ': '🎁',
    'â†©ï¸': '↩️',
    'âœ•': '✕',
    'âœ¦': '✦',
    'â˜°': '☰',
    'ðŸ”': '🔍',
    'ðŸ‘¤': '👤',
    'ðŸ“¦': '📦',
    'â ¤ï¸': '❤️',
    'ðŸ ª': '🏪',
    'ðŸšª': '🚪',
    'ðŸ›’': '🛒',
    'â• â• ': '══',
    'â€¦': '…',
    'â€”': '—',
    'â˜…': '★',
    'ðŸ“¸': '📸',
    'ðŸ“˜': '📘',
    'â–¶ï¸': '▶️'
}

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        modified = False
        
        # 1. Update navbar structure if not already updated
        if 'id="nav-categories-dropdown"' not in content:
            brand_pat = '<a href="index\.html" class="navbar-brand">.*?Arvaan <em>Collective</em></span>\s*</a>'
            match = re.search(brand_pat, content, re.DOTALL)
            if match:
                content = content[:match.end()] + new_dropdown + content[match.end():]
                modified = True
        
        # 2. Remove old cat-navbar if present
        old_nav_pat = r'(?s)<!-- ══ CATEGORY NAV BAR ══ -->.*?<div class="cat-navbar" id="cat-navbar">.*?</div>\s*</div>'
        if re.search(old_nav_pat, content):
            content = re.sub(old_nav_pat, '', content)
            modified = True
            
        # 3. Fix script paths
        if 'src="/js/' in content:
            content = content.replace('src="/js/', 'src="../js/')
            modified = True
            
        # 4. Repair corrupted characters
        for garbled, correct in repair_map.items():
            if garbled in content:
                content = content.replace(garbled, correct)
                modified = True
                
        if modified:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Processed: {file_path}")
    except Exception as e:
        print(f"Failed to process {file_path}: {e}")

def main():
    skip_files = ['index.html', 'shop.html'] # Already handled manually
    for root, dirs, files in os.walk('store'):
        for file in files:
            if file.endswith('.html') and file not in skip_files:
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
