import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('Attendance')
export class Attendance {
  @PrimaryGeneratedColumn()
  AttendanceId: number;

  @Column()
  CheckInTime: Date;

  @Column()
  CheckOutTime: Date;

  @Column()
  IsOvertime: boolean;

  @Column({ nullable: true })
  Note: string;

  @ManyToOne(() => User, user => user.Attendances)
  User: User;

  @Column()
  UserId: number;
}
// The Attendance entity represents the attendance records of users in the dental clinic system.
// It includes fields for check-in and check-out times, overtime status, and an optional note
