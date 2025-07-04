import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Patient } from './patient.entity';
import { User } from './user.entity';
import { Service } from './service.entity';
import { MedicalRecordImage } from './medical-record-image.entity';

@Entity('MedicalRecords')
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  RecordId: number;

  @Column()
  Diagnosis: string;

  @Column()
  TreatmentPlan: string;

  @Column({ nullable: true })
  Note: string;

  @Column()
  RecordDate: Date;

  @ManyToOne(() => Patient, patient => patient.MedicalRecords)
  Patient: Patient;

  @Column()
  PatientId: number;

  @ManyToOne(() => User, user => user.MedicalRecords)
  Doctor: User;

  @Column()
  DoctorId: number;

  @ManyToOne(() => Service, service => service.MedicalRecords)
  Service: Service;

  @Column()
  ServiceId: number;

  @OneToMany(() => MedicalRecordImage, image => image.MedicalRecord)
  Images: MedicalRecordImage[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
