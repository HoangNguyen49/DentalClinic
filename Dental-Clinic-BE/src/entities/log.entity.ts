import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('Logs')
export class Log {
  @PrimaryGeneratedColumn()
  logId: number;

  @Column()
  action: string;

  @Column()
  tableName: string;

  @Column()
  recordId: number;

  @Column()
  actionTime: Date;

  @ManyToOne(() => User, user => user.logs)
  user: User;

  @Column()
  userId: number;
}
