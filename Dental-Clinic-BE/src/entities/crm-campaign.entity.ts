import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CrmLog } from './crm-log.entity';

@Entity('CrmCampaigns')
export class CrmCampaign {
  @PrimaryGeneratedColumn()
  CampaignId: number;

  @Column()
  CampaignName: string;

  @Column()
  Description: string;

  @Column()
  StartDate: Date;

  @Column()
  EndDate: Date;

  @Column()
  Status: string;

  @OneToMany(() => CrmLog, log => log.Campaign)
  CrmLogs: CrmLog[];
}
