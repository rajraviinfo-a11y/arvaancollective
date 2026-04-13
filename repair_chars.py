import os

# Mapping of garbled UTF-8 bytes (misinterpreted as individual characters) to correct symbols
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

def repair_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original_content = content
        for garbled, correct in repair_map.items():
            if garbled in content:
                content = content.replace(garbled, correct)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Repaired: {file_path}")
    except Exception as e:
        print(f"Failed to repair {file_path}: {e}")

def main():
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.html'):
                repair_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
