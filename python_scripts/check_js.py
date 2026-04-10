import jsbeautifier
import sys

def check_syntax(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
        # jsbeautifier will throw exceptions on some syntax errors
        res = jsbeautifier.beautify(code)
        print("Syntax check passed (basic).")
    except Exception as e:
        print(f"Syntax Error likely: {e}")

if __name__ == '__main__':
    check_syntax(sys.argv[1])
