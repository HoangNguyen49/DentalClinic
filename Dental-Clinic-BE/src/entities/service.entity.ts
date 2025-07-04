import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { MedicalRecord } from './medical-record.entity';

@Entity('Services')
export class Service {
  @PrimaryGeneratedColumn()
  ServiceId: number;

  @Column()
  ServiceName: string;

  @Column()
  Description: string;

  @Column('decimal')
  Price: number;

  @Column()
  Duration: number;

  @OneToMany(() => Appointment, appointment => appointment.Service)
  Appointments: Appointment[];

  @OneToMany(() => MedicalRecord, record => record.Service)
  MedicalRecords: MedicalRecord[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
