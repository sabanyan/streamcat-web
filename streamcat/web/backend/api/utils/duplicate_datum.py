def duplicate_datum(finder, source:str):
    """
    指定した複製元からDatumを複製する
    """
    source_datum = finder.data.find_by_uuid(source)
    source_label = source_datum.label + ' のコピー'
    # 同じフォルダ内の他Datumと重複しないラベル名を取得する
    parent = source_datum.find_parent()
    new_label = parent.make_unique_label(source_label)
    # Datumを複製する
    duplicated = source_datum.duplicate(new_label)
    # Allowlistや接続情報を複製APIの戻り値に含めるために参照権限を読み込む
    return duplicated.reload()
