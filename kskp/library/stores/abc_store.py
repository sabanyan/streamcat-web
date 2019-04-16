import os

class AbcStore():

    @property
    def type(self):
        pass

    @staticmethod
    def find_by_uuid(uuid):
        pass

    @staticmethod
    def find_by_parent_uuid(parent_uuid):
        pass

    @staticmethod
    def find_root():
        pass

    def save(self):
        pass

    def update_data(self):
        pass

    def delete(self):
        pass

    @staticmethod
    def get_username_by_id(user_id):
        # usersテーブルへのアクセスはSQLAlchemyを用いる予定なので、以下のコードは暫定実装である
        from ...model import get_user_by_id
        user = get_user_by_id(user_id)
        if user is None:
            return None
        else:
            return user['name']
    
    @staticmethod
    def escape_filename(filename):
        # '/'と'\0'はunixとmacOSではファイル名に使用できない
        trans_table = str.maketrans({'/' : '／', '\0' : ''})
        return filename.translate(trans_table)

    @staticmethod
    def get_another_name(filename):
        (body, ext) = os.path.splitext(filename)
        # 後ろから1番目の'_'でファイル名を区切る
        bodylist = body.rsplit('_', 1)

        if len(bodylist) == 2 and bodylist[1].isdecimal():
            nextNumber = int(bodylist[1]) + 1
            return bodylist[0] + '_' + str(nextNumber)
        else:
            return body + '_1' + ext


        
        

