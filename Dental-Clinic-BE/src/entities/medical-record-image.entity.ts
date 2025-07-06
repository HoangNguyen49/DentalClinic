import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

@Entity('MedicalRecordImages')
export class MedicalRecordImage {
  @PrimaryGeneratedColumn()
  imageId: number;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => MedicalRecord, record => record.images)
  medicalRecord: MedicalRecord;

  @Column()
  recordId: number;

  @CreateDateColumn()
  createdAt: Date;
}
