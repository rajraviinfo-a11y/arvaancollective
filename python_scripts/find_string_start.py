import sys

def find_first_unbalanced_line(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
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
        
        if in_string and string_marker == "'":
            # If we are still in a single-quote string at the end of a line, 
            # and it's not a template literal (which uses backticks), 
            # then it's almost certainly an error because single-quote strings 
            # cannot span multiple lines in JS.
            print(f"Potential unterminated single-quote string starting on line {string_start_line}")
            # print(f"Line content: {lines[string_start_line-1].strip()}")
            return

if __name__ == '__main__':
    find_first_unbalanced_line(sys.argv[1])
