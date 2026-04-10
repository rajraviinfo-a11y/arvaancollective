import sys

def check_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
    brackets = 0
    parens = 0
    in_string = False
    string_marker = None
    line_no = 1
    
    for i, char in enumerate(content):
        if char == '\n': line_no += 1
        
        if char in ["'", '"', '`'] and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_marker = char
            elif string_marker == char:
                in_string = False
        
        if not in_string:
            if char == '{': braces += 1
            elif char == '}': 
                braces -= 1
                if braces < 0:
                    print(f"Excess closing brace at line {line_no}")
                    return
            elif char == '[': brackets += 1
            elif char == ']': 
                brackets -= 1
                if brackets < 0:
                    print(f"Excess closing bracket at line {line_no}")
                    return
            elif char == '(': parens += 1
            elif char == ')': 
                parens -= 1
                if parens < 0:
                    print(f"Excess closing paren at line {line_no}")
                    return

    if braces != 0: print(f"File level imbalance: braces={braces}")
    if brackets != 0: print(f"File level imbalance: brackets={brackets}")
    if parens != 0: print(f"File level imbalance: parens={parens}")
    if in_string: print(f"Unterminated string starting with {string_marker}")
    
    if braces == 0 and brackets == 0 and parens == 0 and not in_string:
        print("Basic balance check PASSED")

if __name__ == '__main__':
    check_balance(sys.argv[1])
