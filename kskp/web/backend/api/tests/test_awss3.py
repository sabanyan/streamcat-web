import os
import unittest
import pprint

from kskp.store import Mountable
from .api_test_case_base import ApiTestCaseBase

@unittest.skip('ASW S3のIDとアカウントが必要')
class AwsS3TestCase(ApiTestCaseBase):
    def test_create_get_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Amazonに感謝',
            'bucket': 'streamcat-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        # POST /awss3sの戻り値が正しいことを検証する
        self.assertIsNotNone(result['data']['uuid'])
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], 'Amazonに感謝')
        self.assertEqual(result['data']['bucket'], 'streamcat-test')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # S3マウント用フォルダが作成されていることを検証する
        self.assertTrue(os.path.isdir((awss3.path).as_posix()))

        # S3フォルダを取得する(GET /awss3s)
        result = self.get_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # GET /awss3sの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], awss3_uuid)
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], 'Amazonに感謝')
        self.assertEqual(result['data']['bucket'], 'streamcat-test')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])
        self.assertIsNotNone(result['data']['children'])
        self.assertEqual(result['data']['folderPath'][0]['uuid'], root_uuid)
        self.assertEqual(result['data']['folderPath'][0]['label'], 'ライブラリ')
        self.assertEqual(result['data']['folderPath'][1]['uuid'], awss3_uuid)
        self.assertEqual(result['data']['folderPath'][1]['label'], 'Amazonに感謝')

        # S3フォルダがマウントされていることを検証する
        self.assertTrue(Mountable.is_mount(awss3.path))

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_update_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path
        
        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Appleに感謝',
            'bucket': 'streamcat-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # S3フォルダのラベルを更新する(PUT /awss3s)
        update_data = {
            'label' : '大根の卸金が欲しい',
            'bucket': 'abc'
        }
        result = self.put_uri('/api/v0/awss3s/' + awss3_uuid, update_data, self.USER1)

        # PUT /awss3sの戻り値が正しいことを検証する
        self.assertEqual(result['data']['uuid'], awss3_uuid)
        self.assertEqual(result['data']['type'], 'awss3')
        self.assertEqual(result['data']['label'], '大根の卸金が欲しい')
        self.assertEqual(result['data']['bucket'], 'abc')
        self.assertEqual(result['data']['creator'], 'ユーザー管理者')
        self.assertIsNotNone(result['data']['createdAt'])

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_remount_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Googleに感謝',
            'bucket': 'streamcat-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # StreamCatの外部からUnmountをする
        import shlex
        import subprocess
        import time
        time.sleep(1)
        awss3_abs_path = (root_path / 'Googleに感謝').as_posix()
        ret = subprocess.run(shlex.split(f'/sbin/umount {awss3_abs_path}'), 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE)
        # umountコマンドの正常終了を確認する
        self.assertEqual(ret.returncode, 0)

        # AwsS3.pathプロパティへのアクセスでremount処理が走る
        tmp_var = awss3.path

        # S3フォルダがマウントされていることを検証する
        self.assertTrue(Mountable.is_mount(awss3.path))

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))

    def test_mount_under_mount_awss3(self):
        root = self.factory.data.load_root()
        root_uuid = root.uuid
        root_path = root.path

        # AWS S3フォルダを作成する(POST /awss3s)
        data = {
            'parent': root_uuid,
            'label' : 'Facebookに感謝',
            'bucket': 'streamcat-test'
        }
        result = self.post_uri('/api/v0/awss3s', data, self.USER1)
        awss3_uuid = result['data']['uuid']
        awss3 = self.factory.data.find_by_uuid(awss3_uuid)

        # AWS S3フォルダの下にAWS S3フォルダを作成しようとする(POST /awss3s)
        data = {
            'parent': awss3_uuid,
            'label' : 'Microsoftにさようなら',
            'bucket': 'streamcat-test'
        }
        # S3フォルダの下にS3フォルダを作成することはできない
        with self.assertRaises(AssertionError) as e:
            result = self.post_uri('/api/v0/awss3s', data, self.USER1)

        # AWS S3フォルダを削除(unmount)する(DELETE /awss3s)
        awss3_path = (awss3.path).as_posix()
        self.delete_uri('/api/v0/awss3s/' + awss3_uuid, self.USER1)

        # S3マウント用フォルダが削除されていることを検証する
        self.assertFalse(os.path.exists(awss3_path))
