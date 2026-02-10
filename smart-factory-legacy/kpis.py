def calcular_disponibilidade(tempo_operando, tempo_total):
    return tempo_operando / tempo_total

def calcular_mtbf(tempo_operando, falhas):
    return tempo_operando / falhas if falhas > 0 else 0

def calcular_mttr(tempo_parado, falhas):
    return tempo_parado / falhas if falhas > 0 else 0

def atualizar_kpis():
    # Aqui entraria query no banco
    pass
