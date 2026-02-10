import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sensor_readings')
export class SensorLeitura {
    @PrimaryGeneratedColumn()
    id: number;

    // Python usa 'device_id', aqui estava 'sensor_id'. Vamos checar se o Python usa 'device_id'.
    // src/database.py: device_id TEXT
    // src/processor.py sends device_id.
    // Entity tinha sensor_id. Vamos mudar para device_id.
    @Column({ name: 'device_id' })
    device_id: string;

    @Column()
    timestamp: string;

    @Column('float', { name: 'temperature' }) // Mapeando explicitamente para garantir
    temperatura: number;

    @Column('float', { name: 'vibration' })
    vibracao: number;

    @Column('float')
    pressure: number;

    @Column()
    status: string;

    @Column('float', { name: 'risk_score', nullable: true })
    riskScore: number;
}
