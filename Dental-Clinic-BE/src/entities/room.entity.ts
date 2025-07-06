import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Chair } from './chair.entity';
import { Appointment } from './appointment.entity';

@Entity('Rooms')
export class Room {
  @PrimaryGeneratedColumn()
  roomId: number;

  @Column()
  roomName: string;

  @Column()
  isPrivate: boolean;

  @Column()
  numberOfChairs: number;

  @OneToMany(() => Chair, chair => chair.room)
  chairs: Chair[];

  @OneToMany(() => Appointment, appointment => appointment.room)
  appointments: Appointment[];
}
