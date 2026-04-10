import sys

def check_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
    brackets = 0
    parens = 0
    in_string = False
    string_marker = None
    
    for i, char in enumerate(content):
        if char in ["'", '"', '`'] and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_marker = char
            elif string_marker == char:
                in_string = False
        
        if not in_string:
            if char == '{': braces += 1
            elif char == '}': braces -= 1
            elif char == '[': brackets += 1
            elif char == ']': brackets -= 1
            elif char == '(': parens += 1
            elif char == ')': parens -= 1
            
            if braces < 0: print(f"Unmatched brace at char {i}"); return
            if brackets < 0: print(f"Unmatched bracket at char {i}"); return
            if parens < 0: print(f"Unmatched paren at char {i}"); return

    if braces != 0: print(f"File level imbalance: braces={braces}")
    if brackets != 0: print(f"File level imbalance: brackets={brackets}")
    if parens != 0: print(f"File level imbalance: parens={parens}")
    if in_string: print("Unterminated string")
    
    if braces == 0 and brackets == 0 and parens == 0 and not in_string:
        print("Basic balance check PASSED")

if __name__ == '__main__':
    check_balance(sys.argv[1])
