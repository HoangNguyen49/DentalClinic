import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('Attendance')
export class Attendance {
  @PrimaryGeneratedColumn()
  attendanceId: number;

  @Column()
  checkInTime: Date;

  @Column()
  checkOutTime: Date;

  @Column()
  isOvertime: boolean;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => User, user => user.attendances)
  user: User;

  @Column()
  userId: number;
}

// The Attendance entity represents the attendance records of users in the dental clinic system.
// It includes fields for check-in and check-out times, overtime status, and an optional note.
