import sqlite3
from pathlib import Path

def execute_sql(file_name):
    data_path = Path(__file__).parent.parent / Path('kskp/data/kskp.db')
    conn = sqlite3.connect(data_path.as_posix())
    c = conn.cursor()
    sql_path = Path(__file__).parent / Path(file_name)
    sql_text = sql_path.read_text()
    c.executescript(sql_text)
    conn.commit()
    conn.close()

execute_sql('create_table.sql')
# execute_sql('insert_data.sql')
