import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('Departments')
export class Department {
  @PrimaryGeneratedColumn()
  DepartmentId: number;

  @Column()
  DepartmentName: string;

  @OneToMany(() => User, user => user.Department)
  Users: User[];
}
