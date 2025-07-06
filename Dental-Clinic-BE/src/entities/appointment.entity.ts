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
import { User } from './user.entity';
import { Service } from './service.entity';
import { Room } from './room.entity';
import { Chair } from './chair.entity';
import { Invoice } from './invoice.entity';
import { ProductUsage } from './product-usage.entity';

@Entity('Appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  appointmentId: number;

  @Column()
  appointmentDateTime: Date;

  @Column()
  status: string;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  channel: string;

  @ManyToOne(() => Patient, patient => patient.appointments)
  patient: Patient;

  @Column()
  patientId: number;

  @ManyToOne(() => User, user => user.appointments)
  doctor: User;

  @Column()
  doctorId: number;

  @ManyToOne(() => Service, service => service.appointments)
  service: Service;

  @Column()
  serviceId: number;

  @ManyToOne(() => Room, room => room.appointments)
  room: Room;

  @Column()
  roomId: number;

  @ManyToOne(() => Chair, chair => chair.appointments)
  chair: Chair;

  @Column()
  chairId: number;

  @OneToMany(() => Invoice, invoice => invoice.appointment)
  invoices: Invoice[];

  @OneToMany(() => ProductUsage, usage => usage.appointment)
  productUsages: ProductUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
