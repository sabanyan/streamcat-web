def get_all_stores():
    ret = [
        {
			"id"     : "folder",
			"version": "1.0.0",
			"label"  : "フォルダ",
			"description": "KSKPが管理するフォルダ",
			"url"    : "",
			"params" : [
                    {
                        "name" : "folderPath",
                        "type" : "string",
                        "label": "フォルダパス"
				    }
                ]
            
		},
        {
			"id"     : "remote-folder",
			"version": "1.0.0",
			"label"  : "リモートフォルダ",
			"description": "KSKPが管理するリモートフォルダ",
			"url"    : "",
			"params" : [
                    {
                        "name" : "user",
                        "type" : "string",
                        "label": "ユーザ名"
				    },
                    {
                        "name" : "password",
                        "type" : "string",
                        "label": "パスワード"
				    },
                    {
                        "name" : "server",
                        "type" : "string",
                        "label": "サーバのホスト名またはIP"
				    },
                    {
                        "name" : "port",
                        "type" : "number",
                        "label": "ポート番号"
				    },
                    {
                        "name" : "domain",
                        "type" : "string",
                        "label": "ドメイン名"
				    },
                    {
                        "name" : "directoryPath",
                        "type" : "string",
                        "label": "ディレクトリパス"
				    }
                ]
		},
        {
			"id"     : "database",
			"version": "1.0.0",
			"label"  : "データベース",
			"description": "KSKPが管理するデータベース",
			"url"    : "",
			"params" : [{
					"name" : "connectionString",
					"type" : "string",
					"label": "接続文字列"
				    }]
		},
    ]
    return ret

def create_store(store_id, data, user_id):
    ret = {
            "id"     : "another-datasotre",
			"version": "1.0.0",
			"label"  : "フォルダ",
			"description": "KSKPが管理するフォルダ",
			"url"    : "",
			"params" : [
                {
                    "name" : "folderPath",
                    "type" : "string",
                    "label": "フォルダパス"
                }
            ]
	}
    return ret

def delete_store_by_id(store_id):
    pass

def get_library():
    ret = {
		"uuid"   : "0cc129d1-7af0-4bb3-8ab9-07710b616b52",
		"type"   : "folder",
		"label"  : "ルート",
		"creator": "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": [
			{
				"uuid"   : "2c792bbc-4679-4396-96d1-94fc023073b1",
				"type"   : "folder",
				"label"  : "実行結果",
				"creator": "user1",
				"createdAt": "2019-01-08 12:00:01"
			},
			{
				"uuid"   : "2C72275F-2019-49AE-B36D-A29D1507F8DD",
				"type"   : "folder",
				"label"  : "アップロードファイル",
				"creator": "user1",
				"createdAt": "2019-01-08 12:00:01"
			},
			{
				"uuid"   : "4C545611-4569-4CD5-800E-55BE69CF8BA8",
				"type"   : "database",
				"label"  : "データベース1",
				"connectionString" : "data source=myDB;user id=user01;password=pass01;"
			}
		]
	}
    return ret


def get_folder(folder_uuid):
    ret = {
		"uuid"   : "44d2abba-68c5-4087-ab93-edfba8835326",
		"type"   : "folder",
		"label"  : "実行結果",
		"creator": "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": [
			{
				"uuid"   : "61f70b75-46ac-4716-ae8d-c0c895775745",
				"type"   : "folder",
				"label"  : "フロー1",
				"creator": "user1",
				"createdAt": "2019-01-08 12:00:01"
			},
			{
				"uuid"   : "67c16604-c3d8-4cdc-a066-9fdd6a3645a3",
				"type"   : "folder",
				"label"  : "フロー2",
				"creator": "user1",
				"createdAt": "2019-01-08 12:00:01"
			}
		]
	}
    return ret   

def create_folder(data, user_id):
    ret = {
		"uuid"   : "96e855e2-a4c6-449c-a884-0950d1f0d683",
		"type"   : "folder",
		"label"  : "新しいフォルダ",
		"creator": "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": []
	}
    return ret   

def rename_folder_by_id(folder_uuid, new_label):
    ret = {
		"uuid"   : "96e855e2-a4c6-449c-a884-0950d1f0d683",
		"type"   : "folder",
		"label"  : "名称変更したフォルダ",
		"creator": "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": []
	}
    return ret

def delete_folder_by_id(folder_uuid):
    pass



def get_remote_folder(folder_uuid):
    ret = {
		"uuid"   : "649e696a-c828-437e-a891-43eec2be42a6",
		"type"   : "remote-folder",
		"label"  : "共有フォルダ",
		"user"   : "user1",
		"password" : "pass",
		"server"   : "192.168.0.3",
		"port"     : "139",
		"domain"   : "WORKGROUP",
		"directory": "share",
		"creator"  : "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": [
			{
				"uuid"   : "0d7aa9b8-cf46-4920-abcd-244e5b3f152b",
				"type"   : "folder",
				"label"  : "資料",
				"creator": "user1",
				"createdAt": "2019-01-08 12:00:01"      
			},
			{
				"uuid"   : "190e134f-8aae-4478-83ea-1281fb7b5ecf",
				"type"   : "frame",
				"label"  : "フロー1の結果",
				"creator": "user1",
				"createdAt": "2019-01-08 12:00:01"
			}
		]
	}
    return ret   

def create_remote_folder(data, user_id):
    ret = {
		"uuid"   : "649e696a-c828-437e-a891-43eec2be42a6",
		"type"   : "remote-folder",
        "label"  : "新しい共有フォルダ",
        "parent" : "0cc129d1-7af0-4bb3-8ab9-07710b616b52",
        "user"   : "user1",
        "password" : "pass",
        "server"   : "192.168.0.3",
        "port"     : "139",
        "domain"   : "WORKGROUP",
        "directory": "share",
		"creator"  : "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": []
	}
    return ret   

def rename_remote_folder_by_id(folder_uuid, new_label):
    ret = {
		"uuid"   : "649e696a-c828-437e-a891-43eec2be42a6",
		"type"   : "remote-folder",
        "label"  : "名称変更した共有フォルダ",
        "parent" : "0cc129d1-7af0-4bb3-8ab9-07710b616b52",
        "user"   : "user1",
        "password" : "pass",
        "server"   : "192.168.0.3",
        "port"     : "139",
        "domain"   : "WORKGROUP",
        "directory": "share",
		"creator"  : "user1",
		"createdAt": "2019-01-08 12:00:01",
		"children": []
	}
    return ret   

def delete_remote_folder_by_id(folder_uuid):
    pass