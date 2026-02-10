import joblib
import pandas as pd
import os

MODEL_PATH = 'modelo_falha.pkl'
modelo = None

def carregar_modelo():
    global modelo
    if os.path.exists(MODEL_PATH):
        modelo = joblib.load(MODEL_PATH)
        print("✅ Modelo de IA carregado na memória.")
    else:
        print("⚠️ Modelo não encontrado. Usando regra básica (fallback).")

def prever_falha(dados_atuais):
    global modelo
    
    # Se o modelo ainda não foi carregado, tenta carregar
    if modelo is None:
        carregar_modelo()
    
    # Se ainda assim não tiver modelo (arquivo não existe), usa regra simples
    if modelo is None:
        if dados_atuais["vibracao"] > 4.5:
             return "ALTO RISCO (Regra Básica)"
        return "NORMAL (Regra Básica)"

    # Preparar dados para o modelo (Dataframe com as mesmas colunas do treino)
    df = pd.DataFrame([{
        'temperatura': dados_atuais['temperatura'],
        'vibracao': dados_atuais['vibracao']
    }])
    
    # Predição (0 ou 1)
    predicao = modelo.predict(df)[0]
    probabilidade = modelo.predict_proba(df)[0][1] # Chance de ser classe 1 (Falha)
    
    if predicao == 1:
        return f"🚨 ALTO RISCO DE FALHA (IA: {probabilidade:.1%})"
    else:
        return f"✅ Operação Normal (Risco: {probabilidade:.1%})"
