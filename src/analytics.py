import pandas as pd
import random
import joblib
import os

class KpiCalculator:
    def __init__(self, db_manager):
        self.db = db_manager

    def calculate_oee(self, device_id):
        """
        Simplistic OEE calculation:
        Availability = (Total Time - Downtime) / Total Time
        Performance = (Actual Output / Target Output) -- Simulated here
        Quality = (Good Parts / Total Parts) -- Simulated here
        """
        # Get last 100 readings
        df = self.db.get_recent_readings(device_id, limit=100)
        if df.empty:
            return 0, 0, 0, 0
        
        total_points = len(df)
        running_points = len(df[df['status'] == 'running'])
        
        availability = running_points / total_points if total_points > 0 else 0
        
        # Simulate performance/quality based on sensor health (e.g., lower vibration = higher quality)
        avg_vib = df['vibration'].mean()
        performance = max(0, 1 - (avg_vib / 10)) # Arbitrary formula
        quality = 0.98 if avg_vib < 5 else 0.85

        oee = availability * performance * quality
        return round(oee * 100, 2), round(availability * 100, 2), round(performance * 100, 2), round(quality * 100, 2)

class FailurePredictor:
    def __init__(self, model_path="modelo_falha.pkl"):
        self.model = None
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                print(f"✅ FailurePredictor: Modelo carregado de {model_path}")
            except Exception as e:
                print(f"❌ Erro ao carregar modelo: {e}")
        else:
            print(f"⚠️ Modelo {model_path} não encontrado. Usando mock.")

    def predict_failure_risk(self, readings_df):
        """
        Uses the loaded Random Forest model to predict failure risk.
        Expected features: ['temperatura', 'vibracao']
        """
        if readings_df.empty:
            return 0.0, 0, 0
            
        # Prepare input features
        try:
            last_reading = readings_df.iloc[-1:] 
            X_input = pd.DataFrame({
                'temperatura': last_reading['temperature'].values,
                'vibracao': last_reading['vibration'].values
            })

            risk = 0.0
            if self.model:
                probabilities = self.model.predict_proba(X_input)
                risk = float(probabilities[0][1])
            else:
                # Fallback Mock
                t = X_input['temperatura'].iloc[0]
                v = X_input['vibracao'].iloc[0]
                if t > 90: risk += 0.5
                if v > 5: risk += 0.4
                risk = min(risk, 1.0)
            
            # --- NEW AI INDICATORS ---
            
            # 1. RUL (Remaining Useful Life) Estimation
            # Simple assumption: Failure happens at Vibration > 10.0
            # We calculate the slope (rate of change) of the last few points
            vib_history = readings_df['vibration'].values
            if len(vib_history) > 3:
                # Linear regression on last 5 points to find trend
                import numpy as np
                y = vib_history[-5:]
                x = np.arange(len(y))
                slope, intercept = np.polyfit(x, y, 1)
                
                current_vib = y[-1]
                limit_vib = 10.0
                
                if slope > 0.01:
                    remaining_steps = (limit_vib - current_vib) / slope
                    rul_hours = max(0, remaining_steps * 0.1) # Arbitrary scaling factor for demo
                else:
                     rul_hours = 999 # Stable
            else:
                rul_hours = 999

            # 2. Energy Waste
            # Need 'power' column. If not present (old mock), assume 0
            energy_waste = 0.0
            if 'power' in readings_df.columns:
                current_power = readings_df.iloc[-1]['power']
                # Baseline for optimal machine is ~500-600W
                if current_power > 600:
                    energy_waste = current_power - 600
                
            return risk, float(rul_hours), float(energy_waste)

        except Exception as e:
            print(f"Erro na predição: {e}")
            return 0.0, 0, 0
