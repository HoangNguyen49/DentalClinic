import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';
import { Payment } from './payment.entity';

@Entity('Invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  InvoiceId: number;

  @Column('decimal')
  TotalAmount: number;

  @Column('decimal')
  PaidAmount: number;

  @Column()
  PaymentStatus: string;

  @Column()
  PaymentMethod: string;

  @Column()
  InvoiceDate: Date;

  @ManyToOne(() => Patient, patient => patient.Invoices)
  Patient: Patient;

  @Column()
  PatientId: number;

  @ManyToOne(() => Appointment, appointment => appointment.Invoices)
  Appointment: Appointment;

  @Column()
  AppointmentId: number;

  @OneToMany(() => Payment, payment => payment.Invoice)
  Payments: Payment[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
