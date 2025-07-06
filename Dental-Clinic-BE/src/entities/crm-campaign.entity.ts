import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CrmLog } from './crm-log.entity';

@Entity('CrmCampaigns')
export class CrmCampaign {
  @PrimaryGeneratedColumn()
  campaignId: number;

  @Column()
  campaignName: string;

  @Column()
  description: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  status: string;

  @OneToMany(() => CrmLog, log => log.campaign)
  crmLogs: CrmLog[];
}
