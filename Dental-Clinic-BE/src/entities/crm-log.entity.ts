import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CrmCampaign } from './crm-campaign.entity';
import { Patient } from './patient.entity';

@Entity('CrmLogs')
export class CrmLog {
  @PrimaryGeneratedColumn()
  LogId: number;

  @Column()
  Channel: string;

  @Column()
  Status: string;

  @Column()
  SentAt: Date;

  @ManyToOne(() => CrmCampaign, campaign => campaign.CrmLogs)
  Campaign: CrmCampaign;

  @Column()
  CampaignId: number;

  @ManyToOne(() => Patient, patient => patient.CrmLogs)
  Patient: Patient;

  @Column()
  PatientId: number;
}
