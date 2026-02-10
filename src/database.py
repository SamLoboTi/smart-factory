import sqlite3
import pandas as pd
import os
from datetime import datetime, timedelta
import json

class DatabaseManager:
    def __init__(self, db_path=None, history_path="history_data"):
        # Prioritize argument, then env var, then default
        if db_path is None:
            db_path = os.getenv("DATABASE_PATH", "smart_factory.db")
            
        self.db_path = db_path
        self.history_path = history_path
        
        if not os.path.exists(self.history_path):
            os.makedirs(self.history_path)

        self._init_relational_db()
        self._init_timeseries_db()
        self._upgrade_schema()

    def _init_relational_db(self):
        """Simulates Supabase (PostgreSQL) for structured data."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Equipment / Devices
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                status TEXT,
                operational_limit_temp REAL,
                operational_limit_vibration REAL
            )
        ''')
        
        # Events / Stops
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT,
                event_type TEXT,
                timestamp DATETIME,
                description TEXT
            )
        ''')

        # Users / Auth
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password_hash TEXT,
                salt TEXT,
                role TEXT
            )
        ''')
        conn.commit()
        conn.close()

    def _init_timeseries_db(self):
        """Simulates TimescaleDB/InfluxDB using a separate table or file approach (here SQLite for simplicity)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                device_id TEXT,
                temperature REAL,
                vibration REAL,
                pressure REAL,
                status TEXT,
                risk_score REAL
            )
        ''')
        conn.commit()
        conn.close()

    def _upgrade_schema(self):
        """Helper to add columns if table already exists (for this prototype)."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
             cursor.execute("ALTER TABLE sensor_readings ADD COLUMN risk_score REAL")
             print("Schema atualizado: coluna risk_score adicionada.")
        except sqlite3.OperationalError:
             pass # Coluna já existe
        
        # Create alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                device_id TEXT,
                device_name TEXT,
                alert_level TEXT,
                risk_score REAL,
                temperature REAL,
                vibration REAL,
                pressure REAL,
                report_text TEXT,
                image_path TEXT,
                notification_sent BOOLEAN DEFAULT 0,
                resolved BOOLEAN DEFAULT 0,
                resolved_at DATETIME,
                resolved_by TEXT
            )
        ''')
        
        conn.commit()
        conn.close()

    def register_device(self, device_id, name, dtype, limits):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO devices (id, name, type, status, operational_limit_temp, operational_limit_vibration)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (device_id, name, dtype, 'active', limits.get('temp', 100), limits.get('vib', 10)))
        conn.commit()
        conn.close()

    def save_reading(self, reading):
        """Save real-time sensor data."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Ensure 'power' column exists (simple migration check)
        try: 
            cursor.execute("ALTER TABLE sensor_readings ADD COLUMN power REAL DEFAULT 0")
        except: pass
        
        cursor.execute('''
            INSERT INTO sensor_readings (timestamp, device_id, temperature, vibration, pressure, status, risk_score, power)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            reading['timestamp'], 
            reading['device_id'], 
            reading['temperature'], 
            reading['vibration'], 
            reading['pressure'],
            reading['status'],
            reading.get('risk_score', 0.0),
            reading.get('power', 0.0)
        ))
        conn.commit()
        conn.close()

    def log_event(self, device_id, event_type, description):
        """Log significant events like stops."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO events (device_id, event_type, timestamp, description)
            VALUES (?, ?, ?, ?)
        ''', (device_id, event_type, datetime.now().isoformat(), description))
        conn.commit()
        conn.close()

    def get_device_info(self, device_id):
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query(f"SELECT * FROM devices WHERE id = '{device_id}'", conn)
        conn.close()
        return df.iloc[0].to_dict() if not df.empty else None

    def get_recent_readings(self, device_id, limit=100):
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query(f"SELECT * FROM sensor_readings WHERE device_id = '{device_id}' ORDER BY timestamp DESC LIMIT {limit}", conn)
        conn.close()
        return df

    def save_historical(self, data_batch, filename):
        """Simulate saving to Data Lake / Storage (CSV)."""
        filepath = os.path.join(self.history_path, filename)
        df = pd.DataFrame(data_batch)
        # Append if exists, else create
        header = not os.path.exists(filepath)
        df.to_csv(filepath, mode='a', header=header, index=False)

    def create_user(self, username, password_hash, salt, role='user'):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO users (username, password_hash, salt, role)
                VALUES (?, ?, ?, ?)
            ''', (username, password_hash, salt, role))
            conn.commit()
            print(f"User {username} created successfully.")
        except sqlite3.IntegrityError:
            print(f"Error: User {username} already exists.")
        finally:
            conn.close()

    def get_user_by_username(self, username):
        conn = sqlite3.connect(self.db_path)
        # Using row_factory to get dict-like access if needed, but here simple tuple or manual dict
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    def get_readings_window(self, device_id, target_time_str, window_minutes=30):
        """Get readings around a timestamp with a wider window for reports."""
        conn = sqlite3.connect(self.db_path)
        try:
            # Try parsing various formats
            if len(target_time_str.split()) == 2:
                # DD/MM/YYYY HH:MM
                target = datetime.strptime(target_time_str, "%d/%m/%Y %H:%M")
            else:
                 # Fallback
                 return pd.DataFrame()
            
            start_window = (target - timedelta(minutes=window_minutes)).isoformat()
            end_window = (target + timedelta(minutes=window_minutes)).isoformat()
            
            query = f"""
                SELECT * FROM sensor_readings 
                WHERE device_id = ? 
                AND timestamp BETWEEN ? AND ?
                ORDER BY timestamp ASC
            """
            
            df = pd.read_sql_query(query, conn, params=(device_id, start_window, end_window))
            conn.close()
            return df
            
        except Exception as e:
            print(f"Error fetching historical window: {e}")
            conn.close()
            return pd.DataFrame()
    
    def save_alert(self, alert_data: dict, report_text: str, image_path: str = None, notification_sent: bool = False):
        """Save alert to database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (
                timestamp, device_id, device_name, alert_level, risk_score,
                temperature, vibration, pressure, report_text, image_path, notification_sent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            alert_data['timestamp'],
            alert_data['device_id'],
            alert_data['device_name'],
            alert_data['alert_level'],
            alert_data['risk_score'],
            alert_data['temperature'],
            alert_data['vibration'],
            alert_data['pressure'],
            report_text,
            image_path,
            notification_sent
        ))
        
        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return alert_id
    
    def get_alert_history(self, device_id: str = None, limit: int = 20):
        """Get alert history from database."""
        conn = sqlite3.connect(self.db_path)
        
        if device_id:
            query = f"SELECT * FROM alerts WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?"
            df = pd.read_sql_query(query, conn, params=(device_id, limit))
        else:
            query = f"SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?"
            df = pd.read_sql_query(query, conn, params=(limit,))
        
        conn.close()
        return df
    
    def get_active_alerts(self, device_id: str = None):
        """Get unresolved alerts."""
        conn = sqlite3.connect(self.db_path)
        
        if device_id:
            query = "SELECT * FROM alerts WHERE device_id = ? AND resolved = 0 ORDER BY timestamp DESC"
            df = pd.read_sql_query(query, conn, params=(device_id,))
        else:
            query = "SELECT * FROM alerts WHERE resolved = 0 ORDER BY timestamp DESC"
            df = pd.read_sql_query(query, conn)
        
        conn.close()
        return df
    
    def resolve_alert(self, alert_id: int, resolved_by: str = "system"):
        """Mark alert as resolved."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE alerts 
            SET resolved = 1, resolved_at = ?, resolved_by = ?
            WHERE id = ?
        ''', (datetime.now().isoformat(), resolved_by, alert_id))
        
        conn.commit()
        conn.close()
