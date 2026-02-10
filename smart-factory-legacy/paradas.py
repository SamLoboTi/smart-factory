def verificar_parada(dados):
    if dados["status"] == "parado":
        return {
            "sensor_id": dados["sensor_id"],
            "inicio_parada": dados["timestamp"]
        }
    return None
