import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CrmCampaign } from './crm-campaign.entity';
import { Patient } from './patient.entity';

@Entity('CrmLogs')
export class CrmLog {
  @PrimaryGeneratedColumn()
  logId: number;

  @Column()
  channel: string;

  @Column()
  status: string;

  @Column()
  sentAt: Date;

  @ManyToOne(() => CrmCampaign, campaign => campaign.crmLogs)
  campaign: CrmCampaign;

  @Column()
  campaignId: number;

  @ManyToOne(() => Patient, patient => patient.crmLogs)
  patient: Patient;

  @Column()
  patientId: number;
}
