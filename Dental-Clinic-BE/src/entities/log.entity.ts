import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('Logs')
export class Log {
  @PrimaryGeneratedColumn()
  LogId: number;

  @Column()
  Action: string;

  @Column()
  TableName: string;

  @Column()
  RecordId: number;

  @Column()
  ActionTime: Date;

  @ManyToOne(() => User, user => user.Logs)
  User: User;

  @Column()
  UserId: number;
}
