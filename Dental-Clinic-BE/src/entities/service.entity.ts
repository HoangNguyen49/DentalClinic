import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { MedicalRecord } from './medical-record.entity';

@Entity('Services')
export class Service {
  @PrimaryGeneratedColumn()
  serviceId: number;

  @Column()
  serviceName: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column()
  duration: number;

  @OneToMany(() => Appointment, appointment => appointment.service)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, record => record.service)
  medicalRecords: MedicalRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
