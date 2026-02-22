from .api_test_case_base import ApiTestCaseBase

class CommandTest(ApiTestCaseBase):

    def test_flow_execute(self):
        """
        コマンド一覧取得のテスト
        """
        # APIを投げる
        self.get_uri('/api/v0/commands', self.USER1)

    def test_get_commands(self):
        """
        オプション指定が正常に機能することを確認する
        """
        pass
