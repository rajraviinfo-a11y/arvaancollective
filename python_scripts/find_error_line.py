import sys

def find_imbalance_line(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    braces = 0
    in_string = False
    string_marker = None
    string_start_line = 0
    
    for line_no, line in enumerate(lines, 1):
        for i, char in enumerate(line):
            if char in ["'", '"', '`'] and (i == 0 or line[i-1] != '\\'):
                if not in_string:
                    in_string = True
                    string_marker = char
                    string_start_line = line_no
                elif string_marker == char:
                    in_string = False
            
            if not in_string:
                if char == '{': braces += 1
                elif char == '}': braces -= 1
        
        if braces < 0:
            print(f"Brace imbalance (underflow) at line {line_no}")
            return
    
    if braces > 0:
        print(f"Brace imbalance (overflow: {braces}) persists to end of file.")
    if in_string:
        print(f"String started with {string_marker} on line {string_start_line} never terminated.")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        find_imbalance_line(sys.argv[1])
    else:
        print("Usage: python find_error_line.py <file_path>")
