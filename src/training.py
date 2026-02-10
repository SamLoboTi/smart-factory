import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# 1. Gerar Dataset Sintético de Histórico
def gerar_dataset(n=1000):
    np.random.seed(42)
    
    # Gerar dados normais
    temperatura_normal = np.random.normal(80, 5, n)
    vibracao_normal = np.random.normal(2.0, 0.5, n)
    status_normal = np.zeros(n) # 0 = OK

    # Gerar dados de falha (Temperaturas altas ou vibração alta)
    temperatura_falha = np.random.normal(100, 10, int(n/4))
    vibracao_falha = np.random.normal(6.0, 1.0, int(n/4))
    status_falha = np.ones(int(n/4)) # 1 = FALHA
    
    # Concatenar
    X = pd.DataFrame({
        'temperatura': np.concatenate([temperatura_normal, temperatura_falha]),
        'vibracao': np.concatenate([vibracao_normal, vibracao_falha])
    })
    y = np.concatenate([status_normal, status_falha])
    
    return X, y

# 2. Treinar Modelo
def treinar_modelo():
    print("🔄 Gerando dataset sintético...")
    X, y = gerar_dataset()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    
    print(f"🧠 Treinando Random Forest com {len(X_train)} amostras...")
    clf = RandomForestClassifier(n_estimators=100)
    clf.fit(X_train, y_train)
    
    acc = accuracy_score(y_test, clf.predict(X_test))
    print(f"✅ Modelo treinado! Acurácia: {acc:.2f}")
    
    # Salvar modelo na raiz para facilitar acesso
    model_path = os.path.join(os.getcwd(), 'modelo_falha.pkl')
    joblib.dump(clf, model_path)
    print(f"💾 Modelo salvo em: {model_path}")

if __name__ == "__main__":
    treinar_modelo()
