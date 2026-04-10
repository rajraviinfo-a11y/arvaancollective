import sys

def check_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = 0
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
            elif char == '}': braces -= 1
        
        if braces < 0:
            print(f"Underflow: extra closing brace at line {line_no}")
            return

    print(f"End of file: braces={braces}, in_string={in_string} ({string_marker})")

if __name__ == '__main__':
    check_file(sys.argv[1])
