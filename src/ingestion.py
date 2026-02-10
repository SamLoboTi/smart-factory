import random
import time
import json
from datetime import datetime

class SensorSimulator:
    def __init__(self, device_id):
        self.device_id = device_id
        self.status = 'running'
        self.pressure_base = 10 # Default
        self.scenario = 'normal'
        self.set_scenario('normal')
        self.steps_to_failure = 0

    def set_scenario(self, scenario):
        self.scenario = scenario
        if scenario == 'positive':
            self.temp_base = 70
            self.vib_base = 1.0
            self.noise_level = 0.5
        elif scenario == 'negative':
            self.temp_base = 100 # High temp
            self.vib_base = 6.0 # High vib
            self.noise_level = 2.0
        else: # normal
            self.temp_base = 60
            self.vib_base = 2.0
            self.noise_level = 1.0

    def generate_packet(self):
        """Generates a data packet resembling a real IoT payload."""
        
        # Simulate some drift or anomalies
        # In negative scenario, failure/anomalies are more frequent
        anomaly_chance = 0.95 if self.scenario != 'negative' else 0.70
        
        if random.random() > anomaly_chance:
            # Random spike
            temp = self.temp_base + random.uniform(10, 20) * self.noise_level
            vib = self.vib_base + random.uniform(2, 5) * self.noise_level
        else:
            # Normal fluctuation
            temp = self.temp_base + random.uniform(-2, 2) * self.noise_level
            vib = self.vib_base + random.uniform(-0.5, 0.5) * self.noise_level

        pressure = self.pressure_base + random.uniform(-1, 1)

        # Simulate breakdown logic
        breakdown_chance = 0.99 if self.scenario != 'negative' else 0.95
        if self.status == 'running' and random.random() > breakdown_chance:
             self.status = 'parado' # Random stop
             self.steps_to_failure = 10 # Stay stopped for 10 ticks
        
        if self.status == 'parado':
            self.steps_to_failure -= 1
            if self.steps_to_failure <= 0:
                self.status = 'running'
            # When stopped, values drop 
            temp = max(25, temp - 20)
            vib = 0
            pressure = 0

        # Simulate power usage (Watts) - correlated with vibration/temp
        # Base consumption + factor of anomalies
        power_usage = 500 + (vib * 20) + (temp * 0.5) 
        if self.scenario == 'positive':
            power_usage *= 0.9 # Efficient
        elif self.scenario == 'negative':
            power_usage *= 1.2 # Inefficient

        return {
            'device_id': self.device_id,
            'timestamp': datetime.now().isoformat(),
            'temperature': round(temp, 2),
            'vibration': round(vib, 2),
            'pressure': round(pressure, 2),
            'power': round(power_usage, 2),
            'status': self.status
        }

class MqttMock:
    """Mocks an MQTT broker/client that simply yields data from registered simulators."""
    def __init__(self):
        self.sensors = []

    def register_sensor(self, sensor):
        self.sensors.append(sensor)

    def listen(self):
        """Generator that yields messages like an MQTT subscription."""
        while True:
            for sensor in self.sensors:
                yield sensor.generate_packet()
            time.sleep(1)  # Simulate network/polling interval
