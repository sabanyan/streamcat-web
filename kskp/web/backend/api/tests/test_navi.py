import pprint

from kskp.core import KSKP_VER
from kskp.store import FlowData
from .api_test_case_base import ApiTestCaseBase

class NavigationTestCase(ApiTestCaseBase):

    def test_get_navigation(self):
        root = self.factory.data.load_root()

        datum_id = 'test'

        # project_uuidなし, flow_uuidなし
        uri = '/api/v0/navigation'
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], '')
        self.assertEqual(data['project_name'], '')
        self.assertEqual(data['flow_uuid'], '')
        self.assertEqual(data['flow_name'], '')
        self.assertEqual(data['version'], KSKP_VER)
        self.assertEqual(data['depo_name'], 'Unit Test')
        
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())
        
        # テスト用フローデータを作成する
        flow_json = {
            'projectId': None,
            'label': 'テストフローです',
            'ports': [[],[]],
            'params': [],
            'description': ""
        }
        node = {
            "id": datum_id,
            "type": "frame",
            "dataSource": "csv",
            "uuid": "",
            "cacheCreatedAt": '2019/01/01'
        }
        flow_json['nodes']=[]
        flow_json['nodes'].append(node)

        test_flow = root.create_flow('テストフローです', FlowData(flow_json))
        test_flow.save()

        flow_uuid = test_flow.uuid
        # project_uuidなし, flow_uuidあり
        uri = '/api/v0/navigation?flow_uuid=' + flow_uuid
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], root.uuid)
        self.assertEqual(data['project_name'], root.label)
        self.assertEqual(data['flow_uuid'], flow_uuid)
        self.assertEqual(data['flow_name'], test_flow.label)
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())
        self.assertEqual(data['version'], KSKP_VER)
        self.assertEqual(data['depo_name'], 'Unit Test')

        project_uuid = data['project_uuid']
        # project_uuidあり, flow_uuidなし
        uri = '/api/v0/navigation?project_uuid=' + project_uuid
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], root.uuid)
        self.assertEqual(data['project_name'], root.label)
        self.assertEqual(data['flow_uuid'], '')
        self.assertEqual(data['flow_name'], '')
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())
        self.assertEqual(data['version'], KSKP_VER)
        self.assertEqual(data['depo_name'], 'Unit Test')

        # project_uuidあり, flow_uuidあり
        uri = '/api/v0/navigation?project_uuid=' + project_uuid + '&flow_uuid=' + flow_uuid
        result = self.get_uri(uri, self.USER1)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER1.id)
        self.assertEqual(data['user_name'], self.USER1.name)
        self.assertEqual(data['project_uuid'], root.uuid)
        self.assertEqual(data['project_name'], root.label)
        self.assertEqual(data['flow_uuid'], flow_uuid)
        self.assertEqual(data['flow_name'], test_flow.label)
        self.assertDictEqual(data['user'], self.USER1.to_json())
        self.assertDictEqual(data['allowlist'], self.USER1.get_allowlist())
        self.assertEqual(data['version'], KSKP_VER)
        self.assertEqual(data['depo_name'], 'Unit Test')

    def test_get_sys_admin_navi(self):
        """
        システム管理者のnavigationを検証する
        """
        result = self.get_uri('/api/v0/navigation', self.USER0)
        data = result['data']
        self.assertEqual(data['user_id'], self.USER0.id)
        self.assertEqual(data['user_name'], self.USER0.name)
        self.assertEqual(data['project_uuid'], '')
        self.assertEqual(data['project_name'], '')
        self.assertEqual(data['flow_uuid'], '')
        self.assertEqual(data['flow_name'], '')
        self.assertDictEqual(data['user'], self.USER0.to_json())
        self.assertDictEqual(data['allowlist'], self.USER0.get_allowlist())
        self.assertEqual(data['version'], KSKP_VER)
        self.assertEqual(data['depo_name'], 'Unit Test')
