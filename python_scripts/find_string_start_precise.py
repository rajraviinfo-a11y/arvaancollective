import sys

def find_string_start(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    in_string = False
    string_marker = None
    line_no = 1
    string_start_line = 1
    
    for i, char in enumerate(content):
        if char == '\n': line_no += 1
        
        if char in ["'", '"', '`'] and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_marker = char
                string_start_line = line_no
            elif string_marker == char:
                in_string = False
                
    if in_string:
        print(f"Unterminated string started with {string_marker} on line {string_start_line}")

if __name__ == '__main__':
    find_string_start(sys.argv[1])
