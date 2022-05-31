import io
import pprint

from streamcat.store import FlowData
from .api_test_case_base import ApiTestCaseBase

class CacheTestCase(ApiTestCaseBase):

    def test_delete_cache(self):
        root = self.factory.data.load_root()

        datum_id = 'test'

        # キャッシュと見立てるフレームを作成する
        cache = root.create_frame('キャッシュです', io.BytesIO(b'0000'))
        cache.save()

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
            "uuid": cache.uuid,
            "cacheCreatedAt": '2019/01/01'
        }
        flow_json['nodes']=[]
        flow_json['nodes'].append(node)

        # フローをライブラリに保存する
        test_flow = root.create_flow('テストフローです', FlowData(flow_json))
        test_flow.save()

        # 作成を確定する
        self.factory.end()

        self.delete_uri('/api/v0/caches?of=%s.%s' % (test_flow.uuid, datum_id), self.USER1)
