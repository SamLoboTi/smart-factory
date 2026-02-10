import time
from ingestao_iot import receber_dados
from paradas import verificar_parada
from kpis import atualizar_kpis
from db import get_connection, init_db
from predicao import prever_falha

def salvar_dados(dados):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO sensor_leituras
        (sensor_id, timestamp, temperatura, vibracao, status)
        VALUES (?, ?, ?, ?, ?)
    """, (
        dados["sensor_id"],
        dados["timestamp"].isoformat(),
        dados["temperatura"],
        dados["vibracao"],
        dados["status"]
    ))

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    init_db()
    while True:
        try:
            dados = receber_dados(sensor_id=1)
            # In a real scenario, we might want to wrap database calls in try/except too
            # For this skeleton, we assume the DB is up or we might crash, which is fine for a script.
            # However, typically I should check if I can actually connect before loop to avoid spamming errors if DB is down.
            # But adhering to the user script 'skeleton' logic:
            
            try:
                salvar_dados(dados)
            except Exception as e:
                print(f"Erro ao salvar dados: {e}")

            parada = verificar_parada(dados)
            if parada:
                print("⚠️ Parada detectada:", parada)

            # Previsão com IA
            previsao = prever_falha(dados)
            print(f"🔮 Status IA: {previsao}")

            atualizar_kpis()
            time.sleep(2)
        except KeyboardInterrupt:
            print("Stopping simulation...")
            break
