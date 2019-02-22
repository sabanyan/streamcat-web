import os
import unittest
import json
import uuid
from pathlib import Path

from kskp.engine.core3 import parse

class EngineTestCase(unittest.TestCase):
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

    # @unittest.skip
    def test_simple_cache(self):
        """
        フローの中間のフレーム1つだけのキャッシュを作る場合のテスト
        """
        # cacheを書き換えたフローを作成する
        original_flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        new_flow_uuid = str(uuid.uuid4())

        new_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (new_flow_uuid + '.json')
        original_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (original_flow_uuid  + '.json')

        flow_json = json.loads(original_flow_path.read_text())
        for node in flow_json['nodes']:
            if node['id'] == 'Bt':
                node['caches'] = True
                new_flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        job = self.execute(new_flow_uuid)

        # キャッシュのテスト
        # cachesの個数
        self.assertEqual(len(job.caches), 1)

        # 作成されたキャッシュの確認テスト
        for flow_and_datum, cache_uuid in job.caches.items():
            target_flow_uuid = flow_and_datum.split(',')[0]
            target_datum_id = flow_and_datum.split(',')[1]

            new_flow_json = json.loads(new_flow_path.read_text())

            # 念の為、キャッシュが作られたフローが同じかどうかもテスト
            self.assertEqual(target_flow_uuid, new_flow_uuid)

            # キャッシュができているかを調べる
            # 1. flowのjsonの、datumのuuidが書き換わっているか
            for node in new_flow_json['nodes']:
                if node['id'] == target_datum_id:
                    self.assertEqual(cache_uuid, node['uuid'])

            # 2. キャッシュのcsvができているか
            cache_path = Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')
            self.assertTrue(cache_path.exists())
            cache_path.unlink()


        # 後片付け
        # flow削除
        new_flow_path.unlink()
        # lasts削除
        for frame in job.lasts.values():
            path = Path(os.environ['KENG_FRAMES_PATH']) / (frame.uuid + '.csv')
            path.unlink()

    # @unittest.skip
    def test_simple_end_cache(self):
        """
        フローの中間のフレーム1つだけのキャッシュを作る場合のテスト
        """
        # cacheを書き換えたフローを作成する
        original_flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        new_flow_uuid = str(uuid.uuid4())

        new_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (new_flow_uuid + '.json')
        original_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (original_flow_uuid  + '.json')

        flow_json = json.loads(original_flow_path.read_text())
        for node in flow_json['nodes']:
            if node['id'] == 'Bo':
                node['caches'] = True
                new_flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        job = self.execute(new_flow_uuid)

        # キャッシュのテスト
        # cachesの個数
        self.assertEqual(len(job.caches), 1)

        # 作成されたキャッシュの確認テスト
        for flow_and_datum, cache_uuid in job.caches.items():
            target_flow_uuid = flow_and_datum.split(',')[0]
            target_datum_id = flow_and_datum.split(',')[1]

            new_flow_json = json.loads(new_flow_path.read_text())

            # 念の為、キャッシュが作られたフローが同じかどうかもテスト
            self.assertEqual(target_flow_uuid, new_flow_uuid)

            # キャッシュができているかを調べる
            # 1. flowのjsonの、datumのuuidが書き換わっているか
            for node in new_flow_json['nodes']:
                if node['id'] == target_datum_id:
                    self.assertEqual(cache_uuid, node['uuid'])

            # 2. キャッシュのcsvができているか
            cache_path = Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')
            self.assertTrue(cache_path.exists())
            cache_path.unlink()


        # 後片付け
        # flow削除
        new_flow_path.unlink()

    # @unittest.skip
    def test_simple_two_caches(self):
        """
        フローの中間と末端のフレーム２つのキャッシュを作る場合のテスト
        """
        # cacheを書き換えたフローを作成する
        original_flow_uuid = '27C35909-504E-43F2-A115-DADB6F57D38C'
        new_flow_uuid = str(uuid.uuid4())

        new_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (new_flow_uuid + '.json')
        original_flow_path = Path(os.environ['KENG_FLOWS_PATH']) / (original_flow_uuid  + '.json')

        flow_json = json.loads(original_flow_path.read_text())
        for node in flow_json['nodes']:
            if node['id'] == 'Bo' or node['id'] == 'Bt':
                node['caches'] = True
                new_flow_path.write_text(json.dumps(flow_json, ensure_ascii=False, indent=2), encoding='utf-8')

        # フローの実行
        job = self.execute(new_flow_uuid)

        # キャッシュのテスト
        # cachesの個数
        self.assertEqual(len(job.caches), 2)

        # 作成されたキャッシュの確認テスト
        for flow_and_datum, cache_uuid in job.caches.items():
            target_flow_uuid = flow_and_datum.split(',')[0]
            target_datum_id = flow_and_datum.split(',')[1]

            new_flow_json = json.loads(new_flow_path.read_text())

            # 念の為、キャッシュが作られたフローが同じかどうかもテスト
            self.assertEqual(target_flow_uuid, new_flow_uuid)

            # キャッシュができているかを調べる
            # 1. flowのjsonの、datumのuuidが書き換わっているか
            for node in new_flow_json['nodes']:
                if node['id'] == target_datum_id:
                    self.assertEqual(cache_uuid, node['uuid'])

            # 2. キャッシュのcsvができているか
            cache_path = Path(os.environ['KENG_FRAMES_PATH']) / (cache_uuid + '.csv')
            self.assertTrue(cache_path.exists())
            cache_path.unlink()


        # 後片付け
        # flow削除
        new_flow_path.unlink()

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

if __name__ == '__main__':
    # パフォーマンステスト時に使ったコード
    runner = unittest.TextTestRunner()
    suite = unittest.TestSuite()
    suite.addTest(NIJapanSampleTestCase('test'))
    runner.run(suite)
