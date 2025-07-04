import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn
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
  AppointmentId: number;

  @Column()
  AppointmentDateTime: Date;

  @Column()
  Status: string;

  @Column({ nullable: true })
  Note: string;

  @Column({ nullable: true })
  Channel: string;

  @ManyToOne(() => Patient, patient => patient.Appointments)
  Patient: Patient;

  @Column()
  PatientId: number;

  @ManyToOne(() => User, user => user.Appointments)
  Doctor: User;

  @Column()
  DoctorId: number;

  @ManyToOne(() => Service, service => service.Appointments)
  Service: Service;

  @Column()
  ServiceId: number;

  @ManyToOne(() => Room, room => room.Appointments)
  Room: Room;

  @Column()
  RoomId: number;

  @ManyToOne(() => Chair, chair => chair.Appointments)
  Chair: Chair;

  @Column()
  ChairId: number;

  @OneToMany(() => Invoice, invoice => invoice.Appointment)
  Invoices: Invoice[];

  @OneToMany(() => ProductUsage, usage => usage.Appointment)
  ProductUsages: ProductUsage[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
