import json

from kskp.store import PathLink

class CommandsPathLink(PathLink):   
    def __init__(self, source):
        super().__init__(source)

    def run(self, args=None, inputs=None):
        """
        コマンド定義のJSONを読んで一覧を返す
        """

        commands = []
        for command_path in self.context['source'].path.iterdir():
            if not command_path.suffix == '.json':
                continue
            command_json = command_path.read_text(encoding='utf-8')
            command_data = json.loads(command_json)
            commands.append(command_data)

        return commands

    def resolve(self, args=None, inputs=None):
        """
        runメソッドのエイリアス
        意味的にlink.resolveの方がわかりやすいかと
        """
        return self.run(args, inputs)
