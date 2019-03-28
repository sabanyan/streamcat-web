INSERT INTO users (email, password, name) VALUES ('admin@kskp.io', '174db695f8aa0fece1329b27d70e8fc2359ad1060003eeb6cc6ad2fcafb95538', '管理者');
INSERT INTO users (email, password, name) VALUES ('dev@kskp.io', '1bdae10ff4532d6bd4c23d54cae62fa4f636b19cf5e3e8f83432a90aea99f33f', '開発用');
INSERT INTO users (email, password, name) VALUES ('grico@kskp.io', '63632217081179f5d4da82f3e1d357ea0c288574c5f74a8adc2fe81c7bc0bece', 'グリコ様用');

INSERT INTO projects (uuid, name, creator) VALUES ('a868644c-b97b-4ef9-aae0-f29f52973f92', '最初のテスト用プロジェクト', 0);
INSERT INTO projects (uuid, name, creator) VALUES ('09d1a654-1fce-466e-8a64-9bcf0ab7d40b', 'MCMDをひとまず動かしてみる', 0);
INSERT INTO projects (uuid, name, creator) VALUES ('0f7e62bc-3c9d-40d1-b17d-858a7a2d153f', 'グリコ様分析プロジェクト', 0);

INSERT INTO users_x_projects (user_id, project_id) VALUES (1, 1);
INSERT INTO users_x_projects (user_id, project_id) VALUES (1, 2);
INSERT INTO users_x_projects (user_id, project_id) VALUES (1, 3);
INSERT INTO users_x_projects (user_id, project_id) VALUES (2, 1);
INSERT INTO users_x_projects (user_id, project_id) VALUES (2, 2);
INSERT INTO users_x_projects (user_id, project_id) VALUES (3, 3);

-- ルートフォルダとその子供たちをlibraryにINSERTする
INSERT INTO library (id, parent_id, uuid, dir_path, type, data, creator, created_at) 
VALUES (1, NULL, '4c423c18-2867-406b-af15-8ad0481c63b4', 'kskp/data/library', 'folder', 
       '{"label":"ROOT FOLDER"}', 1, '2010-01-01 12:00:00');

INSERT INTO library (id, parent_id, uuid, dir_path, type, data, creator, created_at) 
VALUES (11, 1, '2c792bbc-4679-4396-96d1-94fc023073b1', 'kskp/data/library', 'folder', 
       '{"label":"フォルダ"}', 1, '2010-01-01 12:00:01');

INSERT INTO library (id, parent_id, uuid, dir_path, type, data, creator, created_at) 
VALUES (12, 1, '5ff56eff-2537-4608-8605-4320d898195b', 'kskp/data/library', 'remote-folder', 
       '{"label":"共有フォルダ","user":"user1","password":"pass","server":"192.168.0.3","port":"139","domain":"WORKGROUP","directory":"share"}', 1, '2010-01-01 12:00:02');

INSERT INTO library (id, parent_id, uuid, dir_path, type, data, creator, created_at) 
VALUES (13, 1, '8cfde127-68e5-4bc1-a68a-8aa6f68b05ff', 'kskp/data/library', 'database', 
       '{"label":"データベース", "dbms":"ORACLE", "connectionString":"data source=myDB;user id=user01;password=pass01;"}', 1, '2010-01-01 12:00:03');

INSERT INTO library (id, parent_id, uuid, dir_path, type, data, creator, created_at) 
VALUES (14, 1, '44d2abba-68c5-4087-ab93-edfba8835326', 'kskp/data/library', 'frame', 
       '{"label":"フレーム"}', 1, '2010-01-01 12:00:04');

INSERT INTO library (id, parent_id, uuid, dir_path, type, data, creator, created_at) 
VALUES (15, 1, '61f70b75-46ac-4716-ae8d-c0c895775745', 'kskp/data/library', 'document', 
       '{"label":"文書"}', 1, '2010-01-01 12:00:05');