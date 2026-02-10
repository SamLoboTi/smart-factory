import random
from datetime import datetime

def receber_dados(sensor_id):
    return {
        "sensor_id": sensor_id,
        "timestamp": datetime.utcnow(),
        "temperatura": random.uniform(40, 110),
        "vibracao": random.uniform(0.1, 5.0),
        "status": random.choice(["rodando", "parado"])
    }
