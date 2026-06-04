from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import IsolationForest, RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


RANDOM_STATE = 42
MODEL_VERSION = "v1"
MODELS_DIR = Path("models")
DATA_DIR = Path("data")

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
TARGET_FAILURE = "falha_ocorrida"
TARGET_RUL = "tempo_ate_falha_horas"


def gerar_dataset_industrial(n: int = 5000) -> pd.DataFrame:
    """Generate a richer synthetic dataset that resembles industrial telemetry."""
    rng = np.random.default_rng(RANDOM_STATE)

    tipos = np.array(["CNC", "compressor", "bomba", "esteira", "prensa"])
    turnos = np.array(["manha", "tarde", "noite"])

    tipo_equipamento = rng.choice(tipos, n, p=[0.28, 0.20, 0.22, 0.18, 0.12])
    turno = rng.choice(turnos, n, p=[0.38, 0.34, 0.28])

    tipo_factor = pd.Series(tipo_equipamento).map(
        {
            "CNC": 1.05,
            "compressor": 1.20,
            "bomba": 1.00,
            "esteira": 0.85,
            "prensa": 1.15,
        }
    ).to_numpy()
    turno_factor = pd.Series(turno).map({"manha": 0.95, "tarde": 1.00, "noite": 1.08}).to_numpy()

    tempo_operacao_horas = rng.gamma(shape=3.0, scale=900.0, size=n).clip(50, 18000)
    historico_manutencao = rng.poisson(lam=2.2, size=n).clip(0, 14)
    dias_desde_ultima_manutencao = rng.gamma(shape=2.4, scale=26.0, size=n).clip(1, 365)
    carga_maquina = rng.beta(a=4.0, b=2.0, size=n) * 100

    desgaste = (
        0.00009 * tempo_operacao_horas
        + 0.0060 * dias_desde_ultima_manutencao
        + 0.0180 * historico_manutencao
        + 0.0100 * np.maximum(carga_maquina - 70, 0)
        + (tipo_factor - 1.0) * 1.4
        + (turno_factor - 1.0) * 1.0
    )

    temperatura = (
        52
        + carga_maquina * 0.27
        + desgaste * 4.2
        + tipo_factor * 4.5
        + rng.normal(0, 4.0, n)
    ).clip(25, 125)
    vibracao = (
        0.8
        + carga_maquina * 0.018
        + desgaste * 0.72
        + tipo_factor * 0.22
        + rng.normal(0, 0.45, n)
    ).clip(0.1, 14.0)
    corrente_eletrica = (
        12
        + carga_maquina * 0.21
        + temperatura * 0.045
        + tipo_factor * 1.8
        + rng.normal(0, 2.0, n)
    ).clip(4, 65)
    rotacao = (
        1800
        + pd.Series(tipo_equipamento).map(
            {
                "CNC": 900,
                "compressor": 350,
                "bomba": 650,
                "esteira": -250,
                "prensa": -500,
            }
        ).to_numpy()
        - desgaste * 85
        + rng.normal(0, 130, n)
    ).clip(250, 4200)

    risk_logit = (
        -7.0
        + 0.045 * (temperatura - 70)
        + 0.72 * (vibracao - 2.8)
        + 0.030 * (corrente_eletrica - 24)
        + 0.015 * (carga_maquina - 70)
        + 0.00021 * tempo_operacao_horas
        + 0.0090 * dias_desde_ultima_manutencao
        + 0.12 * historico_manutencao
        + np.where(turno == "noite", 0.28, 0)
        + np.where(tipo_equipamento == "compressor", 0.35, 0)
        + np.where(tipo_equipamento == "prensa", 0.22, 0)
    )
    probability = 1 / (1 + np.exp(-risk_logit))
    falha_ocorrida = rng.binomial(1, probability).astype(int)

    base_rul = (
        780
        - 4.8 * (temperatura - 55)
        - 58 * vibracao
        - 3.4 * corrente_eletrica
        - 1.6 * carga_maquina
        - 0.024 * tempo_operacao_horas
        - 2.2 * dias_desde_ultima_manutencao
        + rng.normal(0, 65, n)
    )
    tempo_ate_falha_horas = np.where(
        falha_ocorrida == 1,
        base_rul.clip(1, 720),
        (base_rul + rng.normal(420, 120, n)).clip(240, 2400),
    )

    return pd.DataFrame(
        {
            "temperatura": temperatura.round(2),
            "vibracao": vibracao.round(3),
            "corrente_eletrica": corrente_eletrica.round(2),
            "rotacao": rotacao.round(0),
            "carga_maquina": carga_maquina.round(2),
            "tempo_operacao_horas": tempo_operacao_horas.round(1),
            "turno": turno,
            "tipo_equipamento": tipo_equipamento,
            "historico_manutencao": historico_manutencao,
            "dias_desde_ultima_manutencao": dias_desde_ultima_manutencao.round(1),
            "falha_ocorrida": falha_ocorrida,
            "tempo_ate_falha_horas": tempo_ate_falha_horas.round(1),
        }
    )


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def false_negative_cost(y_true, y_pred, cost_per_failure: float = 50000.0) -> dict:
    false_negatives = int(((y_true == 1) & (y_pred == 0)).sum())
    return {
        "false_negatives": false_negatives,
        "cost_per_failure": cost_per_failure,
        "estimated_total_cost": false_negatives * cost_per_failure,
    }


def evaluate_classifier(name: str, model: Pipeline, x_test, y_test) -> dict:
    y_pred = model.predict(x_test)
    y_proba = model.predict_proba(x_test)[:, 1]
    matrix = confusion_matrix(y_test, y_pred)

    return {
        "model": name,
        "precision_failure": precision_score(y_test, y_pred, pos_label=1, zero_division=0),
        "recall_failure": recall_score(y_test, y_pred, pos_label=1, zero_division=0),
        "f1_failure": f1_score(y_test, y_pred, pos_label=1, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "pr_auc": average_precision_score(y_test, y_proba),
        "confusion_matrix": matrix.tolist(),
        "false_negative_cost": false_negative_cost(y_test, y_pred),
        "classification_report": classification_report(y_test, y_pred, output_dict=True, zero_division=0),
    }


def train_failure_models(x_train, x_test, y_train, y_test) -> tuple[str, Pipeline, list[dict]]:
    candidates = {
        "logistic_regression": Pipeline(
            [
                ("preprocess", build_preprocessor()),
                (
                    "model",
                    LogisticRegression(
                        class_weight="balanced",
                        max_iter=1200,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "random_forest_tuned": Pipeline(
            [
                ("preprocess", build_preprocessor()),
                (
                    "model",
                    GridSearchCV(
                        RandomForestClassifier(class_weight="balanced", random_state=RANDOM_STATE),
                        param_grid={
                            "n_estimators": [120],
                            "max_depth": [10, None],
                            "min_samples_leaf": [2, 5],
                        },
                        scoring="recall",
                        cv=3,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
    }

    results = []
    fitted = {}
    for name, model in candidates.items():
        print(f"Training {name}...")
        model.fit(x_train, y_train)
        fitted[name] = model
        results.append(evaluate_classifier(name, model, x_test, y_test))

    best_result = sorted(
        results,
        key=lambda row: (row["recall_failure"], row["pr_auc"], row["f1_failure"]),
        reverse=True,
    )[0]
    return best_result["model"], fitted[best_result["model"]], results


def train_anomaly_model(normal_rows: pd.DataFrame) -> Pipeline:
    model = Pipeline(
        [
            ("preprocess", build_preprocessor()),
            (
                "model",
                IsolationForest(
                    n_estimators=180,
                    contamination=0.08,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )
    model.fit(normal_rows[FEATURES])
    return model


def train_rul_model(train_df: pd.DataFrame, test_df: pd.DataFrame) -> tuple[Pipeline, dict]:
    model = Pipeline(
        [
            ("preprocess", build_preprocessor()),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=140,
                    max_depth=14,
                    min_samples_leaf=3,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    model.fit(train_df[FEATURES], train_df[TARGET_RUL])
    predictions = model.predict(test_df[FEATURES])
    return model, {"mae_hours": mean_absolute_error(test_df[TARGET_RUL], predictions)}


def write_training_report(metrics: dict, dataset_path: Path) -> None:
    best = metrics["failure_prediction"]["best_model"]
    best_metrics = next(
        item for item in metrics["failure_prediction"]["models"] if item["model"] == best
    )
    report = f"""# ML Training Report

Generated at: {metrics["trained_at"]}

## Objective

Build an initial predictive maintenance pipeline with three AI modules:

1. anomaly detection;
2. failure prediction in the next operating window;
3. remaining useful life (RUL) estimation.

## Dataset

- Source: synthetic industrial dataset generated by `src/training.py`.
- File: `{dataset_path.as_posix()}`.
- Rows: {metrics["dataset"]["rows"]}.
- Failure rate: {metrics["dataset"]["failure_rate"]:.2%}.

## Features

{", ".join(FEATURES)}

## Failure Prediction

Selected model: `{best}`

- Precision failure: {best_metrics["precision_failure"]:.3f}
- Recall failure: {best_metrics["recall_failure"]:.3f}
- F1 failure: {best_metrics["f1_failure"]:.3f}
- ROC-AUC: {best_metrics["roc_auc"]:.3f}
- PR-AUC: {best_metrics["pr_auc"]:.3f}
- Confusion matrix: {best_metrics["confusion_matrix"]}
- False negative count: {best_metrics["false_negative_cost"]["false_negatives"]}
- Estimated false negative cost: ${best_metrics["false_negative_cost"]["estimated_total_cost"]:,.2f}

## RUL

- Model: RandomForestRegressor
- MAE hours: {metrics["rul"]["mae_hours"]:.2f}

## Limitations

- Dataset is still synthetic and must be replaced or calibrated with real plant data.
- Labels represent simulated failures, not validated maintenance work orders.
- Cost model is illustrative and should be configured per asset criticality.
- Anomaly detection uses only synthetic normal data.
"""
    (MODELS_DIR / "training_report.md").write_text(report, encoding="utf-8")


def treinar_modelo() -> dict:
    MODELS_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)

    print("Generating industrial synthetic dataset...")
    dataset = gerar_dataset_industrial()
    dataset_path = DATA_DIR / "synthetic_industrial_maintenance.csv"
    dataset.to_csv(dataset_path, index=False)

    train_df, test_df = train_test_split(
        dataset,
        test_size=0.25,
        stratify=dataset[TARGET_FAILURE],
        random_state=RANDOM_STATE,
    )

    x_train = train_df[FEATURES]
    y_train = train_df[TARGET_FAILURE]
    x_test = test_df[FEATURES]
    y_test = test_df[TARGET_FAILURE]

    best_name, best_failure_model, failure_results = train_failure_models(
        x_train, x_test, y_train, y_test
    )
    anomaly_model = train_anomaly_model(train_df[train_df[TARGET_FAILURE] == 0])
    rul_model, rul_metrics = train_rul_model(train_df, test_df)

    failure_path = MODELS_DIR / f"failure_model_{MODEL_VERSION}.pkl"
    anomaly_path = MODELS_DIR / f"anomaly_model_{MODEL_VERSION}.pkl"
    rul_path = MODELS_DIR / f"rul_model_{MODEL_VERSION}.pkl"
    bundle_path = MODELS_DIR / f"predictive_maintenance_bundle_{MODEL_VERSION}.pkl"

    joblib.dump(best_failure_model, failure_path)
    joblib.dump(anomaly_model, anomaly_path)
    joblib.dump(rul_model, rul_path)
    joblib.dump(
        {
            "version": MODEL_VERSION,
            "features": FEATURES,
            "numeric_features": NUMERIC_FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "failure_model": best_failure_model,
            "anomaly_model": anomaly_model,
            "rul_model": rul_model,
        },
        bundle_path,
    )

    # Backward compatibility with the current simulator.
    joblib.dump(best_failure_model, "modelo_falha.pkl")

    metrics = {
        "version": MODEL_VERSION,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "path": dataset_path.as_posix(),
            "rows": int(len(dataset)),
            "failure_rate": float(dataset[TARGET_FAILURE].mean()),
        },
        "features": FEATURES,
        "failure_prediction": {
            "best_model": best_name,
            "models": failure_results,
        },
        "anomaly_detection": {
            "model": "IsolationForest",
            "contamination": 0.08,
        },
        "rul": rul_metrics,
    }

    metrics_path = MODELS_DIR / f"metrics_{MODEL_VERSION}.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    write_training_report(metrics, dataset_path)

    print(f"Best failure model: {best_name}")
    print(f"Artifacts saved in {MODELS_DIR.resolve()}")
    return metrics


if __name__ == "__main__":
    treinar_modelo()
