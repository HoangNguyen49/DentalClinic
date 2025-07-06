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
import { MedicalRecordImage } from './medical-record-image.entity';

@Entity('MedicalRecords')
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  recordId: number;

  @Column()
  diagnosis: string;

  @Column()
  treatmentPlan: string;

  @Column({ nullable: true })
  note: string;

  @Column()
  recordDate: Date;

  @ManyToOne(() => Patient, patient => patient.medicalRecords)
  patient: Patient;

  @Column()
  patientId: number;

  @ManyToOne(() => User, user => user.medicalRecords)
  doctor: User;

  @Column()
  doctorId: number;

  @ManyToOne(() => Service, service => service.medicalRecords)
  service: Service;

  @Column()
  serviceId: number;

  @OneToMany(() => MedicalRecordImage, image => image.medicalRecord)
  images: MedicalRecordImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
