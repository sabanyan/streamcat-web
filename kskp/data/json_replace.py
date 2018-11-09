import json
from pathlib import Path

COMMAND_PATH = Path('kskp/data/commands')

def main():
    for path in COMMAND_PATH.iterdir():
        data = json.loads(path.read_text())
        if data['description'].startswith('.'):
            data['url'] = data['description']
            data['description'] = ''
        else:
            data['url'] = ''

        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
if __name__ == '__main__':
    main()
