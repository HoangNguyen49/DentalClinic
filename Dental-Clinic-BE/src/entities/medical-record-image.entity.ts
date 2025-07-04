import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

@Entity('MedicalRecordImages')
export class MedicalRecordImage {
  @PrimaryGeneratedColumn()
  ImageId: number;

  @Column()
  ImageUrl: string;

  @Column({ nullable: true })
  Description: string;

  @ManyToOne(() => MedicalRecord, record => record.Images)
  MedicalRecord: MedicalRecord;

  @Column()
  RecordId: number;

  @CreateDateColumn()
  CreatedAt: Date;
}
