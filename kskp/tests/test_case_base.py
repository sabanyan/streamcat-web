import os
import unittest

from ..library import Frame

class TestCaseBase(unittest.TestCase):

    def save_frame_to_library(self, frame_uuid, frame_file_path):
        """
        指定したパスのフレームを、指定したUUIDでライブラリに登録する
        """
        from kskp.model import get_frame_dir_path
        # テストで用いるテスト用フレームをライブラリに登録する
        if not Frame.exists(frame_uuid):
            # テストで用いるテスト用フレームをライブラリに登録する
            frame_folder = get_frame_dir_path(user_id=1)
            class_name = self.__class__.__name__
            new_frame = Frame(frame_folder.uuid, 'テスト用フレーム(%s)' % class_name, None)
            new_frame.uuid = frame_uuid
            new_frame.save_with_path(frame_file_path)

    def remove_frame_from_library(self, frame_uuid):
        """
        指定したUUIDのフレームをライブラリから削除する
        (実ファイルは削除しない)
        """
        frame = Frame.find_by_uuid(frame_uuid)
        if frame is not None:
            frame.delete_without_file()


    # def get_uri(uri, user_id):
    #     """
    #     URIをGETする
    #     """
    #     with app.test_client() as client:
    #         with client.session_transaction() as session:
    #             session['user_id'] = '1'
    #         response = client.get(uri)
    #         result = json.loads(response.get_data())
    #     unittest.TestCase.assertTrue(result['success'])
    #     return result