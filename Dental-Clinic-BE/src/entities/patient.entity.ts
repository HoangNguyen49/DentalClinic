import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { MedicalRecord } from './medical-record.entity';
import { Invoice } from './invoice.entity';
import { CrmLog } from './crm-log.entity';

@Entity('Patients')
export class Patient {
  @PrimaryGeneratedColumn()
  PatientId: number;

  @Column()
  FullName: string;

  @Column()
  Gender: string;

  @Column()
  DateOfBirth: Date;

  @Column()
  Phone: string;

  @Column()
  Email: string;

  @Column()
  Address: string;

  @Column({ nullable: true })
  Note: string;

  @OneToMany(() => Appointment, appointment => appointment.Patient)
  Appointments: Appointment[];

  @OneToMany(() => MedicalRecord, record => record.Patient)
  MedicalRecords: MedicalRecord[];

  @OneToMany(() => Invoice, invoice => invoice.Patient)
  Invoices: Invoice[];

  @OneToMany(() => CrmLog, crmLog => crmLog.Patient)
  CrmLogs: CrmLog[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
