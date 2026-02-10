-- Execute this in your PostgreSQL database 'smart_factory'

CREATE TABLE IF NOT EXISTS sensor_leituras (
    id SERIAL PRIMARY KEY,
    sensor_id INT NOT NULL,
    timestamp TIMESTAMP NOT NULLCode,
    temperatura FLOAT,
    vibracao FLOAT,
    status VARCHAR(50)
);

-- Optional: Create a hypertable if using TimescaleDB
-- SELECT create_hypertable('sensor_leituras', 'timestamp');
