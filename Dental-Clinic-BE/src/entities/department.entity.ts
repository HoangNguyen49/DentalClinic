import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('Departments')
export class Department {
  @PrimaryGeneratedColumn()
  departmentId: number;

  @Column()
  departmentName: string;

  @OneToMany(() => User, user => user.department)
  users: User[];
}
