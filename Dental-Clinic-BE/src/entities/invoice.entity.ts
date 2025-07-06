import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';
import { Payment } from './payment.entity';

@Entity('Invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  invoiceId: number;

  @Column('decimal')
  totalAmount: number;

  @Column('decimal')
  paidAmount: number;

  @Column()
  paymentStatus: string;

  @Column()
  paymentMethod: string;

  @Column()
  invoiceDate: Date;

  @ManyToOne(() => Patient, patient => patient.invoices)
  patient: Patient;

  @Column()
  patientId: number;

  @ManyToOne(() => Appointment, appointment => appointment.invoices)
  appointment: Appointment;

  @Column()
  appointmentId: number;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
