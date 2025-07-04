import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { Appointment } from './appointment.entity';
import { MedicalRecord } from './medical-record.entity';
import { Attendance } from './attendance.entity';
import { Log } from './log.entity';

@Entity('Users')
export class User {
  @PrimaryGeneratedColumn()
  UserId: number;

  @Column()
  FullName: string;

  @Column({ unique: true })
  Username: string;

  @Column()
  PasswordHash: string;

  @Column({ unique: true })
  Email: string;

  @Column({ nullable: true })
  Phone: string;

  @Column()
  Role: string;

  @Column({ nullable: true })
  AvatarUrl: string;

  @Column({ nullable: true })
  DepartmentId: number;

  @ManyToOne(() => Department, (department) => department.Users)
  Department: Department;

  @OneToMany(() => Appointment, (appointment) => appointment.Doctor)
  Appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (record) => record.Doctor)
  MedicalRecords: MedicalRecord[];

  @OneToMany(() => Attendance, (attendance) => attendance.User)
  Attendances: Attendance[];

  @OneToMany(() => Log, (log) => log.User)
  Logs: Log[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
