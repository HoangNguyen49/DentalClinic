import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Chair } from './chair.entity';
import { Appointment } from './appointment.entity';

@Entity('Rooms')
export class Room {
  @PrimaryGeneratedColumn()
  RoomId: number;

  @Column()
  RoomName: string;

  @Column()
  IsPrivate: boolean;

  @Column()
  NumberOfChairs: number;

  @OneToMany(() => Chair, chair => chair.Room)
  Chairs: Chair[];

  @OneToMany(() => Appointment, appointment => appointment.Room)
  Appointments: Appointment[];
}
