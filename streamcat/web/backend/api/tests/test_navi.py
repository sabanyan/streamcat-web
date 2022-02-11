import pprint
from streamcat.core import STREAMCAT_VER
from .api_test_case_base import ApiTestCaseBase

class NavigationTestCase(ApiTestCaseBase):

    def test_get_sys_admin_navi(self):
        """
        システム管理者のnavigationを検証する
        """
        result = self.get_uri('/api/v0/navigation', self.USER0)
        data = result['data']
        self.assertEqual(data['version'], STREAMCAT_VER)
        self.assertEqual(data['depoName'], 'Unit Test')
        self.assertDictEqual(data['user'], self.USER0.to_json())
        self.assertDictEqual(data['allowlist'], self.USER0.get_allowlist())
        # ユーザ操作のallowlistを検証する
        self.assertFalse(data['allowlist']['findUsers'])
        self.assertFalse(data['allowlist']['createUser'])
        self.assertFalse(data['allowlist']['updateUser'])
        self.assertTrue(data['allowlist']['updateSelfUser'])
        self.assertFalse(data['allowlist']['readUserPassword'])
        self.assertFalse(data['allowlist']['deleteUser'])

    def test_get_navigation(self):
        """
        ユーザ管理者のnavigationを検証する
        """
        result = self.get_uri('/api/v0/navigation', self.USER1)
        data = result['data']
        self.assertEqual(data['version'], STREAMCAT_VER)
        self.assertEqual(data['depoName'], 'Unit Test')
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())
        # ユーザ操作のallowlistを検証する
        self.assertTrue(data['allowlist']['findUsers'])
        self.assertTrue(data['allowlist']['createUser'])
        self.assertTrue(data['allowlist']['updateUser'])
        self.assertTrue(data['allowlist']['updateSelfUser'])
        self.assertTrue(data['allowlist']['readUserPassword'])
        self.assertTrue(data['allowlist']['deleteUser'])
