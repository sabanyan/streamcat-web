import Constants from "Constants/index";

export default class LibraryUtil {
    static getTypeLabel(type: string): string {
        let typeLabel;
        switch (type) {
            case Constants.library.type.project:
                typeLabel = "プロジェクト";
                break;
            case Constants.library.type.trash:
                typeLabel = "ゴミ箱";
                break;
            case Constants.library.type.database:
                typeLabel = "データベース";
                break;
            case Constants.library.type.document:
                typeLabel = "ファイル";
                break;
            case Constants.library.type.flow:
                typeLabel = "フロー";
                break;
            case Constants.library.type.folder:
                typeLabel = "フォルダ";
                break;
            case Constants.library.type.frame:
                typeLabel = "データ";
                break;
            case Constants.library.type.remoteFolder:
                typeLabel = "リモートフォルダ";
                break;
        }
        return typeLabel;
    }
}
