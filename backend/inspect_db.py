import sqlite3
import os

DB = 'dtmis.db'
path = os.path.join(os.path.dirname(__file__), DB)
if not os.path.exists(path):
    print('DB not found:', path)
else:
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    rows = cur.fetchall()
    for r in rows:
        print(r[0])
    conn.close()
