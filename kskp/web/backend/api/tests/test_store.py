import pprint
from .api_test_case_base import ApiTestCaseBase

class DataStoreTestCase(ApiTestCaseBase):

    def test_create_fetchall_delete_stores(self):
        """
        fetch_stores APIをテストする
        """
        # storesテーブルへのセット
        store1 = self.factory0.store.create(
                            'Directory',
                            '1.0.0',
                            'ディレクトリ',
                            '',
                            '',
                            [{'name':'filePath', 'type':'string', 'label':'CSVファイル格納パス名'}])
        store2 = self.factory0.store.create(
                            'PostgreSQL',
                            '1.0.0',
                            'PostgreSQLへの接続設定(ODBC)',
                            '',
                            '',
                            [{'name':'connectionString', 'type':'string', 'label':'postgreSQLへの接続文字列'}])
        self.factory0._session.add(store1)
        self.factory0._session.add(store2)
        self.factory0._session.commit()

        # GET /stores
        result = self.get_uri('/api/v0/stores', self.USER0)

        # 期待するAPIの戻り値
        expected_result = [
            {
                'id'     : 'Directory',
                'version': '1.0.0',
                'label'  : 'ディレクトリ',
                'description'  : '',
                'url'   : '',
                'params': [{
                        'name' : 'filePath',
                        'type' : 'string',
                        'label': 'CSVファイル格納パス名'
                        }]
            },
            {
                'id'     : 'PostgreSQL',
                'version': '1.0.0',
                'label'  : 'PostgreSQLへの接続設定(ODBC)',
                'description'  : '',
                'url'   : '',
                'params': [{
                        'name' : 'connectionString',
                        'type' : 'string',
                        'label': 'postgreSQLへの接続文字列'
                        }]
            }
        ]

        # storesテーブルに設定した値をGET /stores apiで取得できることを検証する
        self.assertEqual(result['data'], expected_result)

        # DELETE /stores
        self.delete_uri('/api/v0/stores/%s' % expected_result[0]['id'], self.USER0)
        self.delete_uri('/api/v0/stores/%s' % expected_result[1]['id'], self.USER0)

    def test_create_fetch_delete_store(self):
        """
        create_store APIをテストする
        """
        # POSTするデータ
        data = {
                'id'       : 'Directory',
                'version'  : '1.0.1',
                'label'    : 'ディレクトリ',
                'description': 'ディレクトリ以下のファイルをデータソースとする',
                'url'      : 'http://',
                'params'   :
                    [
                        {'name' : 'directoryPath',
                         'type' : 'string',
                         'label': 'ディレクトリパス'},
                        {'name' : 'dummy',
                         'type' : 'int',
                         'label': 'テスト用ダミー'}                         
                    ]
               }

        # POST /stores
        result = self.post_uri('/api/v0/stores', data, self.USER0)

        # POST /stores　apiが正常終了することを検証する
        expected_result = data
        self.assertEqual(result['data'], expected_result)

        # GET /stores
        result = self.get_uri('/api/v0/stores/%s' % expected_result['id'], self.USER0)

        # POST /storesした値をGET /stores apiで取得できることを検証する
        self.assertEqual(result['data'], data)

        # DELETE /stores
        result = self.delete_uri('/api/v0/stores/%s' % expected_result['id'], self.USER0)

        # GET /stores
        with self.assertRaises(AssertionError) as e:
            result = self.get_uri('/api/v0/stores/%s' % expected_result['id'], self.USER0)
