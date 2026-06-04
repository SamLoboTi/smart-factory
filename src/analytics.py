from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


NUMERIC_FEATURES = [
    "temperatura",
    "vibracao",
    "corrente_eletrica",
    "rotacao",
    "carga_maquina",
    "tempo_operacao_horas",
    "historico_manutencao",
    "dias_desde_ultima_manutencao",
]
CATEGORICAL_FEATURES = ["turno", "tipo_equipamento"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


class KpiCalculator:
    def __init__(self, db_manager):
        self.db = db_manager

    def calculate_oee(self, device_id):
        df = self.db.get_recent_readings(device_id, limit=100)
        if df.empty:
            return 0, 0, 0, 0

        total_points = len(df)
        running_points = len(df[df["status"] == "running"])
        availability = running_points / total_points if total_points > 0 else 0

        avg_vib = df["vibration"].mean()
        performance = max(0, 1 - (avg_vib / 10))
        quality = 0.98 if avg_vib < 5 else 0.85

        oee = availability * performance * quality
        return (
            round(oee * 100, 2),
            round(availability * 100, 2),
            round(performance * 100, 2),
            round(quality * 100, 2),
        )

    def calculate_mtbf(self, device_id):
        df = self.db.get_recent_readings(device_id, limit=1000)
        if df.empty:
            return 0

        df = df.sort_values("timestamp")
        uptime_minutes = len(df[df["status"] == "running"])
        df["prev_status"] = df["status"].shift(1)
        failures = len(df[(df["status"] == "parado") & (df["prev_status"] == "running")])

        if failures == 0:
            return uptime_minutes

        return round(uptime_minutes / failures, 1)

    def calculate_mttr(self, device_id):
        df = self.db.get_recent_readings(device_id, limit=1000)
        if df.empty:
            return 0

        downtime_minutes = len(df[df["status"] == "parado"])
        df = df.sort_values("timestamp")
        df["prev_status"] = df["status"].shift(1)
        repairs = len(df[(df["status"] == "running") & (df["prev_status"] == "parado")])

        if repairs == 0:
            return 0

        return round(downtime_minutes / repairs, 1)


class FailurePredictor:
    def __init__(self, model_path: str | None = None):
        self.bundle: dict[str, Any] | None = None
        self.model = None
        self.anomaly_model = None
        self.rul_model = None
        self.features = FEATURES

        bundle_path = Path(model_path or os.getenv("MODEL_BUNDLE_PATH", "models/predictive_maintenance_bundle_v1.pkl"))
        legacy_path = Path("modelo_falha.pkl")

        try:
            if bundle_path.exists():
                self.bundle = joblib.load(bundle_path)
                self.model = self.bundle.get("failure_model")
                self.anomaly_model = self.bundle.get("anomaly_model")
                self.rul_model = self.bundle.get("rul_model")
                self.features = self.bundle.get("features", FEATURES)
                print(f"FailurePredictor: loaded model bundle from {bundle_path}")
            elif legacy_path.exists():
                self.model = joblib.load(legacy_path)
                self.features = ["temperatura", "vibracao"]
                print(f"FailurePredictor: loaded legacy model from {legacy_path}")
            else:
                print("FailurePredictor: no model found. Using heuristic fallback.")
        except Exception as exc:
            print(f"FailurePredictor: failed to load model: {exc}")

    def predict_failure_risk(self, readings_df):
        """Backward-compatible method used by the simulator and alert manager."""
        result = self.predict(readings_df)
        return (
            float(result["failure_risk"]),
            float(result["rul_hours"]),
            float(result["energy_waste"]),
        )

    def predict(self, readings_df) -> dict[str, Any]:
        if readings_df is None or readings_df.empty:
            return self._empty_result()

        prepared = self._prepare_features(readings_df)
        risk = self._predict_failure_probability(prepared)
        anomaly = self.detect_anomaly(readings_df)
        rul_hours = self.estimate_rul(readings_df)
        energy_waste = self._estimate_energy_waste(prepared.iloc[-1])
        explanation = self.explain_prediction(prepared, risk, anomaly, rul_hours)

        return {
            "failure_risk": risk,
            "failure_probability_24h": risk,
            "anomaly_score": anomaly["anomaly_score"],
            "is_anomaly": anomaly["is_anomaly"],
            "rul_hours": rul_hours,
            "rul_days": round(rul_hours / 24, 2),
            "energy_waste": energy_waste,
            "explanation": explanation,
            "model_version": self.bundle.get("version", "legacy") if self.bundle else "heuristic_or_legacy",
        }

    def detect_anomaly(self, readings_df) -> dict[str, Any]:
        prepared = self._prepare_features(readings_df)
        latest = prepared.iloc[[-1]]

        if self.anomaly_model:
            raw_score = float(self.anomaly_model.decision_function(latest)[0])
            prediction = int(self.anomaly_model.predict(latest)[0])
            anomaly_score = float(max(0, min(1, 0.5 - raw_score)))
            return {"is_anomaly": prediction == -1, "anomaly_score": anomaly_score}

        row = latest.iloc[0]
        score = 0.0
        if row["vibracao"] > 5.0:
            score += 0.35
        if row["temperatura"] > 90.0:
            score += 0.30
        if row["corrente_eletrica"] > 40.0:
            score += 0.20
        if row["dias_desde_ultima_manutencao"] > 120:
            score += 0.15
        return {"is_anomaly": score >= 0.50, "anomaly_score": min(score, 1.0)}

    def estimate_rul(self, readings_df) -> float:
        prepared = self._prepare_features(readings_df)
        latest = prepared.iloc[[-1]]

        if self.rul_model:
            return float(max(1.0, self.rul_model.predict(latest)[0]))

        row = latest.iloc[0]
        rul = (
            900
            - 5.0 * max(row["temperatura"] - 60, 0)
            - 55.0 * max(row["vibracao"] - 2.0, 0)
            - 2.0 * row["carga_maquina"]
            - 0.025 * row["tempo_operacao_horas"]
            - 2.0 * row["dias_desde_ultima_manutencao"]
        )
        return float(max(1.0, min(2400.0, rul)))

    def explain_prediction(
        self,
        prepared: pd.DataFrame,
        risk: float,
        anomaly: dict[str, Any],
        rul_hours: float,
    ) -> list[str]:
        row = prepared.iloc[-1]
        reasons = []

        if row["vibracao"] > 4.5:
            reasons.append("Vibration is above the historical safe range.")
        elif len(prepared) >= 5 and prepared["vibracao"].tail(5).is_monotonic_increasing:
            reasons.append("Vibration is rising in the latest readings.")

        if row["temperatura"] > 85:
            reasons.append("Temperature is close to or above the operational limit.")
        elif len(prepared) >= 5 and prepared["temperatura"].tail(5).is_monotonic_increasing:
            reasons.append("Temperature is trending upward.")

        if row["tempo_operacao_horas"] > 6000:
            reasons.append("Equipment has high accumulated operating hours.")

        if row["dias_desde_ultima_manutencao"] > 90:
            reasons.append("Maintenance interval appears overdue.")

        if row["carga_maquina"] > 85:
            reasons.append("Machine load is high, increasing mechanical stress.")

        if anomaly["is_anomaly"]:
            reasons.append("Current telemetry is outside the learned normal operating pattern.")

        if rul_hours < 72:
            reasons.append("Estimated RUL is below 72 hours.")

        if not reasons:
            reasons.append("Telemetry is within the learned normal operating envelope.")

        if risk >= 0.70:
            reasons.insert(0, "High failure risk detected by the predictive model.")
        elif risk >= 0.40:
            reasons.insert(0, "Moderate failure risk detected by the predictive model.")

        return reasons

    def _predict_failure_probability(self, prepared: pd.DataFrame) -> float:
        latest = prepared.iloc[[-1]]

        if self.model:
            try:
                probabilities = self.model.predict_proba(latest)
                return float(probabilities[0][1])
            except Exception as exc:
                print(f"FailurePredictor: model inference failed, using heuristic: {exc}")

        row = latest.iloc[0]
        risk = 0.0
        if row["temperatura"] > 90:
            risk += 0.35
        if row["vibracao"] > 5:
            risk += 0.35
        if row["corrente_eletrica"] > 38:
            risk += 0.15
        if row["dias_desde_ultima_manutencao"] > 120:
            risk += 0.10
        if row["tempo_operacao_horas"] > 7000:
            risk += 0.10
        return float(min(risk, 1.0))

    def _prepare_features(self, readings_df: pd.DataFrame) -> pd.DataFrame:
        df = readings_df.copy()
        rename_map = {
            "temperature": "temperatura",
            "vibration": "vibracao",
            "power": "corrente_eletrica",
        }
        df = df.rename(columns=rename_map)

        if "corrente_eletrica" not in df.columns:
            df["corrente_eletrica"] = 18 + df.get("vibracao", 2.0) * 2.2 + df.get("temperatura", 65.0) * 0.08
        if "rotacao" not in df.columns:
            df["rotacao"] = 2200 - df.get("vibracao", 2.0) * 60
        if "carga_maquina" not in df.columns:
            df["carga_maquina"] = np.clip(55 + df.get("vibracao", 2.0) * 5 + df.get("temperatura", 65.0) * 0.15, 20, 100)
        if "tempo_operacao_horas" not in df.columns:
            df["tempo_operacao_horas"] = 2500
        if "turno" not in df.columns:
            df["turno"] = "manha"
        if "tipo_equipamento" not in df.columns:
            df["tipo_equipamento"] = "CNC"
        if "historico_manutencao" not in df.columns:
            df["historico_manutencao"] = 2
        if "dias_desde_ultima_manutencao" not in df.columns:
            df["dias_desde_ultima_manutencao"] = 45

        for feature in NUMERIC_FEATURES:
            df[feature] = pd.to_numeric(df[feature], errors="coerce")
            df[feature] = df[feature].fillna(df[feature].median() if not df[feature].isna().all() else 0)

        for feature in CATEGORICAL_FEATURES:
            df[feature] = df[feature].fillna("unknown").astype(str)

        return df[FEATURES]

    def _estimate_energy_waste(self, row: pd.Series) -> float:
        expected_current = 12 + row["carga_maquina"] * 0.20
        extra_current = max(0.0, float(row["corrente_eletrica"] - expected_current))
        return round(extra_current * 220.0 / 1000.0, 3)

    def _empty_result(self) -> dict[str, Any]:
        return {
            "failure_risk": 0.0,
            "failure_probability_24h": 0.0,
            "anomaly_score": 0.0,
            "is_anomaly": False,
            "rul_hours": 0.0,
            "rul_days": 0.0,
            "energy_waste": 0.0,
            "explanation": ["No readings available for inference."],
            "model_version": self.bundle.get("version", "unknown") if self.bundle else "none",
        }
