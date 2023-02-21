import io
import unittest
import pprint
from streamcat.core import SavableDatum
from .api_test_case_base import ApiTestCaseBase

class AllowlistTest(ApiTestCaseBase):

    def test_allowlist(self):
        """
        Datumのallowlistを検証する
        """
        # ROOTを取得する
        root = self.factory.data.load_root()

        # キャッシュフォルダの下にフレームを作成する
        f = (io.BytesIO(b'teihenda'), 'cache1')
        result = self.post_frames('一心太助', SavableDatum.CACHE_FOLDER_UUID, f, self.USER2)
        cache_uuid = result['uuid']

        # プロジェクトを作成する
        result = self.post_uri('/api/v0/projects', {'parent':root.uuid, 'label':'暴れん坊将軍'}, self.USER1)
        project_uuid = result['uuid']

        # 
        # USER2を、プロジェクトに編集者メンバとして参加させる
        # 
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Writer'}, self.USER1)

        # プロジェクトの下にフォルダを作成する
        result = self.post_uri('/api/v0/folders', {'label':'水戸黄門', 'parent':project_uuid}, self.USER2)
        folder_uuid = result['uuid']

        # フォルダの下にフローを作成する
        # プロジェクト管理者は、プロジェクト内にフローを作成する
        data = {
            'parent': folder_uuid,
            'label': '遠山の金さん',
            'flow': {
                'nodes': [
                    {
                        'id': 'c',
                        'label': 'c',
                        'type': 'command',
                        'commandId': 'mnewnumber',
                        'args': {
                            'a': 'k',
                            'l': '10'
                        },
                        'srcs': {},
                        'dsts': {
                            'o': 'd'
                        },
                    },
                    {
                        'id': 'd',
                        'label': 'd',
                        'type': 'frame',
                        'dataSource': 'csv'
                    },
                    {
                        'id': 'o',
                        'label': 'ライブラリ',
                        'type': 'flow',
                        'classification': 'data_dest',
                        'args': {},
                        'srcs': {
                            'i': 'd'
                        },
                        'dsts': {},
                        'flow': {
                            'label': 'ライブラリ',
                            'nodes': [
                                {
                                    'id': 'd',
                                    'label': 'd',
                                    'type': 'frame',
                                    'dataSource': 'csv'
                                },
                                {
                                    'id': 's',
                                    'label': 'ライブラリ',
                                    'type': 'store',
                                    'uuid': folder_uuid
                                },
                                {
                                    'id': 'c1',
                                    'label': 'c1',
                                    'type': 'command',
                                    'commandId': 'saver',
                                    'args': {},
                                    'srcs': {
                                        'i': 'd',
                                        'folder': 's'
                                    },
                                    'dsts': {
                                        'o': 'd1'
                                    }
                                },
                                {
                                    'id': 'd1',
                                    'label': 'd1',
                                    'type': 'frame',
                                    'dataSource': 'csv'
                                }
                            ],
                            'ports': [
                                [
                                    {
                                        'label': 'i',
                                        'types': ['mcmd'],
                                        'nodeId': 'd'
                                    }
                                ],
                                []
                            ]
                        }
                    }
                ]
            }
        }
        result = self.post_uri('/api/v0/flows', data, self.USER2)
        flow_uuid = result['uuid']

        # フローを実行してアクティビティフォルダの下にアクティビティを作成する
        result = self.post_uri(f'/api/v0/activities', {'uuid':flow_uuid}, self.USER2)
        activity_uuid = result['uuid']

        # フォルダの下にフレームを作成する
        f = (io.BytesIO(b'abcABC'), 'frame1')
        result = self.post_frames('大岡越前', folder_uuid, f, self.USER2)
        frame_uuid = result['uuid']

        # フォルダの下にDatabaseを作成する
        data = {
            'parent'   : folder_uuid,
            'label'    : '桃太郎侍',
            'dbms'     : 'postgresql',
            'hostname' : 'db',
            'port'     : 5432,
            'database' : 'streamcat',
            'userId'   : 'postgres',
            'password' : ''
        }
        result = self.post_uri('/api/v0/databases', data, self.USER2)
        database_uuid = result['uuid']

        # フォルダの下にリモートフォルダを作成する
        data = {
            'parent'   : folder_uuid,
            'label'    : '中村主水',
            'protocol' : 'smb',
            'hostname' : '18.178.64.116',
            'domain'   : 'WORKGROUP',
            'directory': 'share',
            'userId'   : 'samba',
            'password' : 'kskanalytics'
        }
        result = self.post_uri('/api/v0/remote-folders', data, self.USER2)
        remote_folder_uuid = result['uuid']

        # フォルダの下にスケジュールを作成する
        data = {
            'parent': project_uuid,
            'label' : '私のスケジュール',
            'runnable' : flow_uuid,
            'trigger': {
                'type' : 'date',
                'date' : '2121-09-10 11:22:30'
            }
        }
        result = self.post_uri('/api/v0/schedules', data, self.USER2)
        schedule_uuid = result['uuid']

        # # フォルダの下にAWS S3を作成する
        # data = {
        #     'parent': folder_uuid,
        #     'label' : '銭形平次',
        #     'bucket': 'streamcat-test'
        # }
        # result = self.post_uri('/api/v0/awss3s', data, self.USER2)
        # awss3_uuid = result['uuid']

        # 編集者メンバは、ルートフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{root.uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、キャッシュフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{SavableDatum.CACHE_FOLDER_UUID}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、キャッシュを取得する
        result = self.get_uri(f'/api/v0/frames/{cache_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、アクティビティフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{SavableDatum.ACTIVITY_FOLDER_UUID}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、アクティビティを取得する
        result = self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertTrue(result['allowlist']['createFolder'])
        self.assertTrue(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、プロジェクトを取得する
        # (GET /projects で取得する)
        results = self.get_uri('/api/v0/projects', self.USER2)
        self.assertGreater(len(results), 0)
        result0 = [result for result in results if result['label'] == '暴れん坊将軍'][0]
        self.assertTrue(result0['allowlist']['read'])
        self.assertFalse(result0['allowlist']['createProject'])
        self.assertTrue(result0['allowlist']['createFolder'])
        self.assertTrue(result0['allowlist']['createFile'])
        self.assertFalse(result0['allowlist']['update'])
        self.assertFalse(result0['allowlist']['delete'])
        self.assertFalse(result0['allowlist']['execute'])
        self.assertFalse(result0['allowlist']['move'])
        self.assertTrue(result0['allowlist']['copy'])
        self.assertTrue(result0['allowlist']['upload'])
        self.assertFalse(result0['allowlist']['import'])
        self.assertTrue(result0['allowlist']['download'])
        self.assertFalse(result0['allowlist']['export'])
        self.assertFalse(result0['allowlist']['findMember'])
        self.assertFalse(result0['allowlist']['updateMember'])
        self.assertFalse(result0['allowlist']['lock'])

        # 編集者メンバは、フォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertTrue(result['allowlist']['createFolder'])
        self.assertTrue(result['allowlist']['createFile'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertTrue(result['allowlist']['lock'])

        # 編集者メンバは、フレームを取得する
        result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、Databaseを取得する
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、リモートフォルダを取得する
        result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 編集者メンバは、スケジュールを取得する
        result = self.get_uri(f'/api/v0/schedules/{schedule_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # # 編集者メンバは、AWS S3を取得する
        # result = self.get_uri(f'/api/v0/awss3s/{awss3_uuid}', self.USER2)
        # self.assertTrue(result['allowlist']['read'])
        # self.assertNotIn('createProject', result['allowlist'])
        # self.assertNotIn('createFolder', result['allowlist'])
        # self.assertNotIn('createFile', result['allowlist'])
        # self.assertTrue(result['allowlist']['update'])
        # self.assertTrue(result['allowlist']['delete'])
        # self.assertFalse(result['allowlist']['execute'])
        # self.assertTrue(result['allowlist']['move'])
        # self.assertTrue(result['allowlist']['copy'])
        # self.assertNotIn('upload', result['allowlist'])
        # self.assertTrue(result['allowlist']['download'])
        # self.assertFalse(result['allowlist']['findMember'])
        # self.assertFalse(result['allowlist']['updateMember'])
        # self.assertFalse(result['allowlist']['lock'])

        # 
        # USER2を、プロジェクトの閲覧者メンバに変更する
        # 
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Reader'}, self.USER1)
 
        # 閲覧者メンバは、ルートフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{root.uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、キャッシュフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{SavableDatum.CACHE_FOLDER_UUID}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、アクティビティフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{SavableDatum.ACTIVITY_FOLDER_UUID}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、アクティビティを取得する
        result = self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、プロジェクトを取得する
        # (GET /projects で取得する)
        results = self.get_uri('/api/v0/projects', self.USER2)
        self.assertGreater(len(results), 0)
        result0 = [result for result in results if result['label'] == '暴れん坊将軍'][0]
        self.assertTrue(result0['allowlist']['read'])
        self.assertFalse(result0['allowlist']['createProject'])
        self.assertFalse(result0['allowlist']['createFolder'])
        self.assertFalse(result0['allowlist']['createFile'])
        self.assertFalse(result0['allowlist']['update'])
        self.assertFalse(result0['allowlist']['delete'])
        self.assertFalse(result0['allowlist']['execute'])
        self.assertFalse(result0['allowlist']['move'])
        self.assertFalse(result0['allowlist']['copy'])
        self.assertFalse(result0['allowlist']['upload'])
        self.assertFalse(result0['allowlist']['import'])
        self.assertFalse(result0['allowlist']['download'])
        self.assertFalse(result0['allowlist']['export'])
        self.assertFalse(result0['allowlist']['findMember'])
        self.assertFalse(result0['allowlist']['updateMember'])
        self.assertFalse(result0['allowlist']['lock'])

        # 閲覧者メンバは、フォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、フレームを取得する
        result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、Databaseを取得する
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、リモートフォルダを取得する
        result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、スケジュールを取得する
        result = self.get_uri(f'/api/v0/schedules/{schedule_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # # 閲覧者メンバは、AWS S3を取得する
        # result = self.get_uri(f'/api/v0/awss3s/{awss3_uuid}', self.USER2)
        # self.assertTrue(result['allowlist']['read'])
        # self.assertNotIn('createProject', result['allowlist'])
        # self.assertNotIn('createFolder', result['allowlist'])
        # self.assertNotIn('createFile', result['allowlist'])
        # self.assertFalse(result['allowlist']['update'])
        # self.assertFalse(result['allowlist']['delete'])
        # self.assertFalse(result['allowlist']['execute'])
        # self.assertFalse(result['allowlist']['move'])
        # self.assertFalse(result['allowlist']['copy'])
        # self.assertNotIn('upload', result['allowlist'])
        # self.assertFalse(result['allowlist']['download'])
        # self.assertFalse(result['allowlist']['findMember'])
        # self.assertFalse(result['allowlist']['updateMember'])
        # self.assertFalse(result['allowlist']['lock'])

        # 
        # USER2を、プロジェクトのプロジェクト管理者に変更する
        # 
        result = self.put_uri(f'/api/v0/projects/{project_uuid}/users/{self.USER2.uuid}', {'memberType':'Owner'}, self.USER1)
 
        # プロジェクト管理者は、ルートフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{root.uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertTrue(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、キャッシュフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{SavableDatum.CACHE_FOLDER_UUID}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、アクティビティフォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{SavableDatum.ACTIVITY_FOLDER_UUID}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertFalse(result['allowlist']['createFolder'])
        self.assertFalse(result['allowlist']['createFile'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertFalse(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # 閲覧者メンバは、アクティビティを取得する
        result = self.get_uri(f'/api/v0/activities/{activity_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertFalse(result['allowlist']['update'])
        self.assertFalse(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertFalse(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、プロジェクトを取得する
        result = self.get_uri(f'/api/v0/projects/{project_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertTrue(result['allowlist']['createFolder'])
        self.assertTrue(result['allowlist']['createFile'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertFalse(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertTrue(result['allowlist']['findMember'])
        self.assertTrue(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、プロジェクトを取得する
        # (GET /projects で取得する)
        results = self.get_uri('/api/v0/projects', self.USER2)
        self.assertGreater(len(results), 0)
        result0 = [result for result in results if result['label'] == '暴れん坊将軍'][0]
        self.assertTrue(result0['allowlist']['read'])
        self.assertFalse(result0['allowlist']['createProject'])
        self.assertTrue(result0['allowlist']['createFolder'])
        self.assertTrue(result0['allowlist']['createFile'])
        self.assertTrue(result0['allowlist']['update'])
        self.assertTrue(result0['allowlist']['delete'])
        self.assertFalse(result0['allowlist']['execute'])
        self.assertFalse(result0['allowlist']['move'])
        self.assertTrue(result0['allowlist']['copy'])
        self.assertTrue(result0['allowlist']['upload'])
        self.assertFalse(result0['allowlist']['import'])
        self.assertTrue(result0['allowlist']['download'])
        self.assertFalse(result0['allowlist']['export'])
        self.assertTrue(result0['allowlist']['findMember'])
        self.assertTrue(result0['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、フォルダを取得する
        result = self.get_uri(f'/api/v0/folders/{folder_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertFalse(result['allowlist']['createProject'])
        self.assertTrue(result['allowlist']['createFolder'])
        self.assertTrue(result['allowlist']['createFile'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertTrue(result['allowlist']['upload'])
        self.assertFalse(result['allowlist']['import'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、フローを取得する
        result = self.get_uri(f'/api/v0/flows/{flow_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertTrue(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertTrue(result['allowlist']['lock'])

        # プロジェクト管理者は、フレームを取得する
        result = self.get_uri(f'/api/v0/frames/{frame_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、Databaseを取得する
        result = self.get_uri(f'/api/v0/databases/{database_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、リモートフォルダを取得する
        result = self.get_uri(f'/api/v0/remote-folders/{remote_folder_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertTrue(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # プロジェクト管理者は、スケジュールを取得する
        result = self.get_uri(f'/api/v0/schedules/{schedule_uuid}', self.USER2)
        self.assertTrue(result['allowlist']['read'])
        self.assertNotIn('createProject', result['allowlist'])
        self.assertNotIn('createFolder', result['allowlist'])
        self.assertNotIn('createFile', result['allowlist'])
        self.assertTrue(result['allowlist']['update'])
        self.assertTrue(result['allowlist']['delete'])
        self.assertFalse(result['allowlist']['execute'])
        self.assertTrue(result['allowlist']['move'])
        self.assertTrue(result['allowlist']['copy'])
        self.assertNotIn('upload', result['allowlist'])
        self.assertFalse(result['allowlist']['download'])
        self.assertFalse(result['allowlist']['export'])
        self.assertFalse(result['allowlist']['findMember'])
        self.assertFalse(result['allowlist']['updateMember'])
        self.assertFalse(result['allowlist']['lock'])

        # # プロジェクト管理者は、AWS S3を取得する
        # result = self.get_uri(f'/api/v0/awss3s/{awss3_uuid}', self.USER2)
        # self.assertTrue(result['allowlist']['read'])
        # self.assertNotIn('createProject', result['allowlist'])
        # self.assertNotIn('createFolder', result['allowlist'])
        # self.assertNotIn('createFile', result['allowlist'])
        # self.assertTrue(result['allowlist']['update'])
        # self.assertTrue(result['allowlist']['delete'])
        # self.assertFalse(result['allowlist']['execute'])
        # self.assertTrue(result['allowlist']['move'])
        # self.assertTrue(result['allowlist']['copy'])
        # self.assertNotIn('upload', result['allowlist'])
        # self.assertTrue(result['allowlist']['download'])
        # self.assertFalse(result['allowlist']['findMember'])
        # self.assertFalse(result['allowlist']['updateMember'])
        # self.assertFalse(result['allowlist']['lock'])

        # プロジェクトを削除する
        self.delete_uri(f'/api/v0/projects/{project_uuid}', self.USER2)

        # ゴミ箱を空にする
        self.delete_uri('/api/v0/trashes', self.USER2)
