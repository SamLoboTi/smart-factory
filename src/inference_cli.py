from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.analytics import FailurePredictor


def load_payload() -> pd.DataFrame:
    raw = sys.stdin.read().strip()
    if not raw:
        return pd.DataFrame()

    payload = json.loads(raw)
    if isinstance(payload, list):
        return pd.DataFrame(payload)
    if isinstance(payload, dict) and "readings" in payload:
        return pd.DataFrame(payload["readings"])
    if isinstance(payload, dict):
        return pd.DataFrame([payload])
    return pd.DataFrame()


def main() -> int:
    parser = argparse.ArgumentParser(description="Predictive maintenance inference CLI")
    parser.add_argument(
        "mode",
        choices=["predict-failure", "detect-anomaly", "estimate-rul", "risk"],
        help="Inference mode to execute.",
    )
    args = parser.parse_args()

    predictor = FailurePredictor()
    readings = load_payload()

    if args.mode in {"predict-failure", "risk"}:
        result = predictor.predict(readings)
    elif args.mode == "detect-anomaly":
        result = predictor.detect_anomaly(readings)
    else:
        result = {"rul_hours": predictor.estimate_rul(readings)}
        result["rul_days"] = round(result["rul_hours"] / 24, 2)

    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
