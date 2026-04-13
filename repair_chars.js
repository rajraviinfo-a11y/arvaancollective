const fs = require('fs');
const path = require('path');

const map = {
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
};

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else if (file.endsWith('.html')) {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

const htmlFiles = walkSync('.');
console.log(`Found ${htmlFiles.length} HTML files to repair.`);

htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.keys(map).forEach(key => {
        if (content.includes(key)) {
            content = content.split(key).join(map[key]);
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Repaired: ${filePath}`);
    }
});
