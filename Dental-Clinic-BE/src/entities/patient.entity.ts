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
import { Invoice } from './invoice.entity';
import { CrmLog } from './crm-log.entity';

@Entity('Patients')
export class Patient {
  @PrimaryGeneratedColumn()
  patientId: number;

  @Column()
  fullName: string;

  @Column()
  gender: string;

  @Column()
  dateOfBirth: Date;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  note: string;

  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, record => record.patient)
  medicalRecords: MedicalRecord[];

  @OneToMany(() => Invoice, invoice => invoice.patient)
  invoices: Invoice[];

  @OneToMany(() => CrmLog, crmLog => crmLog.patient)
  crmLogs: CrmLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
