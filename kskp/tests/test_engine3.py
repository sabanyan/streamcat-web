import os
import unittest
import json
import uuid
from pathlib import Path

from kskp.engine.core3 import parse

class EngineTestCase(unittest.TestCase):

    def setUp(self):
        os.environ['KENG_FLOWS_PATH'] = 'kskp/data/flows'
        os.environ['KENG_FRAMES_PATH'] = 'kskp/data/frames'

    def execute(self, flow_uuid, step_paths=None):
        job = parse(flow_uuid)
        job.execute(step_paths=step_paths)

        for port, datum in job.lasts.items():
            datum.command_to_file().dtor()
        job.dtor()

        return job

    @unittest.skip
    def test_simple(self):
        self.execute('27C35909-504E-43F2-A115-DADB6F57D38C')

    @unittest.skip
    def test_step_paths(self):
        self.execute('27C35909-504E-43F2-A115-DADB6F57D38C', 'Bt')

    @unittest.skip
    def test_ni(self):
        self.execute('2C096E39-28BD-491B-B0E2-7ECFFD113304')

    @unittest.skip
    def test_ni(self):
        self.execute('japan_ni_improvement0')

    @unittest.skip
    def test_pandas(self):
        self.execute('BCA335C6-675C-49E2-A8B4-5E655CB46256')

    @unittest.skip
    def test_kcmd(self):
        self.execute('ACA335C6-675C-49E2-A8B4-5E655CB46254')

    @unittest.skip
    def test_nysol(self):
        self.execute('A70ECCC4-5304-4C20-A212-EC069A3289E1')

class CacheTestCase(unittest.TestCase):
    """
    キャッシュに関するテスト
    """
    def setUp(self):
        os.environ['KENG_FLOWS_PATH'] = 'kskp/data/flows'
        os.environ['KENG_FRAMES_PATH'] = 'kskp/data/frames'

        # cacheを書き換え専用のフローとそのパス
        self.original_flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        self.new_flow_uuid = str(uuid.uuid4())

        self.new_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (self.new_flow_uuid + '.json')
        self.original_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (self.original_flow_uuid  + '.json')

    def execute(self, flow_uuid, step_paths=None):
        job = parse(flow_uuid)
        job.execute(step_paths=step_paths)

        for port, datum in job.lasts.items():
            datum.command_to_file().dtor()
        job.dtor()

        return job

    def update_caches_true_in_flow(self, datum_id_list, original_flow_path):
        """
        指定したoriginalのflowを使って
        指定したdatum_idのcacheをtrueに変換したflowのjsonを返す
        """
        flow_json = json.loads(original_flow_path.read_text())
        for node in flow_json['nodes']:
            if node['id'] in datum_id_list:
                node['caches'] = True
        return flow_json

    def check_caches_test(self, job):
        """
        指定されたjob（一番上の親jobを想定）が持っている情報を元に
        cachesに関するテストを行う
        """
        for flow_and_datum, cache_uuid in job.caches.items():
            target_flow_uuid = flow_and_datum.split(',')[0]
            target_datum_id = flow_and_datum.split(',')[1]

            new_flow_json = json.loads(self.new_flow_path.read_text())

            # 念の為、キャッシュが作られたフローが同じかどうかもテスト
            self.assertEqual(target_flow_uuid, self.new_flow_uuid)

            # キャッシュができているかを調べる
            # 1. flowのjsonの、datumのuuidが書き換わっているか
            for node in new_flow_json['nodes']:
                if node['id'] == target_datum_id:
                    self.assertEqual(cache_uuid, node['uuid'])

            # 2. キャッシュのcsvができているか
            cache_path = Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')
            self.assertTrue(cache_path.exists())

    # @unittest.skip
    def test_simple_cache(self):
        """
        フローの中間のフレーム1つだけのキャッシュを作る場合のテスト
        """
        # 変更対象のdatum_id
        true_cache_data = ['Bt']

        flow_json = self.update_caches_true_in_flow(true_cache_data, self.original_flow_path)
        self.new_flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        job = self.execute(self.new_flow_uuid)

        # キャッシュのテスト
        # cachesの個数
        self.assertEqual(len(job.caches), 1)

        # 作成されたキャッシュの確認テスト
        self.check_caches_test(job)

        # 後片付け
        # flow削除
        self.new_flow_path.unlink()
        # lasts削除
        for frame in job.lasts.values():
            path = Path(os.environ['KENG_FRAMES_PATH']) / (frame.uuid + '.csv')
            path.unlink()
        # キャッシュされたcsvを削除
        for flow_and_datum, cache_uuid in job.caches.items():
            (Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')).unlink()

    # @unittest.skip
    def test_simple_end_cache(self):
        """
        フローの末端のフレーム1つだけのキャッシュを作る場合のテスト
        """
        # 変更対象のdatum_id
        true_cache_data = ['Bo']

        flow_json = self.update_caches_true_in_flow(true_cache_data, self.original_flow_path)
        self.new_flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        job = self.execute(self.new_flow_uuid)

        # キャッシュのテスト
        # cachesの個数
        self.assertEqual(len(job.caches), 1)

        # 作成されたキャッシュの確認テスト
        self.check_caches_test(job)

        # 後片付け
        # flow削除
        self.new_flow_path.unlink()
        # キャッシュされたcsvを削除
        for flow_and_datum, cache_uuid in job.caches.items():
            (Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')).unlink()

    # @unittest.skip
    def test_simple_two_caches(self):
        """
        フローの中間と末端のフレーム２つのキャッシュを作る場合のテスト
        """
        # 変更対象のdatum_id
        true_cache_data = ['Bo', 'Bt']

        flow_json = self.update_caches_true_in_flow(true_cache_data, self.original_flow_path)
        self.new_flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        job = self.execute(self.new_flow_uuid)

        # キャッシュのテスト
        # cachesの個数
        self.assertEqual(len(job.caches), 2)

        # 作成されたキャッシュの確認テスト
        self.check_caches_test(job)

        # 後片付け
        # flow削除
        self.new_flow_path.unlink()
        # キャッシュされたcsvを削除
        for flow_and_datum, cache_uuid in job.caches.items():
            (Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')).unlink()

if __name__ == '__main__':
    # パフォーマンステスト時に使ったコード
    runner = unittest.TextTestRunner()
    suite = unittest.TestSuite()
    suite.addTest(NIJapanSampleTestCase('test'))
    runner.run(suite)
