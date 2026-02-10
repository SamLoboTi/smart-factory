import sqlite3
import os

DB_NAME = "smart_factory.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def init_db():
    """Initializes the SQLite database with the required table."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sensor_leituras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            temperatura REAL,
            vibracao REAL,
            status TEXT
        )
    """)
    conn.commit()
    conn.close()
    print(f"✅ Banco de dados SQLite '{DB_NAME}' inicializado com sucesso!")
