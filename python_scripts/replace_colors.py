import sys

files = [
    r"c:\Users\ravi.raj\.gemini\antigravity\scratch\css\components.css",
    r"c:\Users\ravi.raj\.gemini\antigravity\scratch\css\seller.css",
    r"c:\Users\ravi.raj\.gemini\antigravity\scratch\index.html",
    r"c:\Users\ravi.raj\.gemini\antigravity\scratch\seller.html"
]

replacements = {
    # Replace the previous light theme blues/emeralds with neutral grays/blacks
    "#60A5FA": "#6B7280",   # light gray
    "#2563EB": "#000000",   # black
    "#34D399": "#10B981",   # fresh emerald
    "#059669": "#047857",
    "#93C5FD": "#9CA3AF",
    "#6EE7B7": "#34D399",
    "#7DD3FC": "#9CA3AF",
    "#FCA5A5": "#F87171",
    
    # Replace gradients in html
    "linear-gradient(135deg,#6C63FF 0%,#00D4AA 100%)": "linear-gradient(135deg, #111827 0%, #374151 100%)",
    "color:#6C63FF": "color:#111827",
    
    # Fix the cart badge the hardcoded gradient inside components if there's any
    "rgba(59,130,246": "rgba(17,24,39",
    "rgba(6,182,212": "rgba(75,85,99",
    
    # Turn the navbar bottom line and sidebar bottom line into faint gray
    "rgba(0,0,0,0.4)": "rgba(0,0,0,0.06)",
    "rgba(0,0,0,0.3)": "rgba(0,0,0,0.06)",
    
    # Turn hard shadows into completely gone or very faint
    "0 40px 100px rgba(0,0,0,0.8)": "0 20px 40px rgba(0,0,0,0.1)",
    "0 32px 80px rgba(0,0,0,0.8)": "0 20px 40px rgba(0,0,0,0.1)",
    "0 24px 60px rgba(0,0,0,0.7)": "0 10px 24px rgba(0,0,0,0.08)",
    "0 8px 40px rgba(0,0,0,0.7)": "0 4px 12px rgba(0,0,0,0.08)"
}

for f in files:
    try:
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
        for k, v in replacements.items():
            content = content.replace(k, v)
        with open(f, "w", encoding="utf-8") as file:
            file.write(content)
    except Exception as e:
        print(f"Error on {f}: {e}")

print("Done")
