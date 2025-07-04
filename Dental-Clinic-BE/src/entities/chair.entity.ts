import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Room } from './room.entity';
import { Appointment } from './appointment.entity';

@Entity('Chairs')
export class Chair {
  @PrimaryGeneratedColumn()
  ChairId: number;

  @Column()
  ChairNumber: string;

  @Column()
  RoomId: number;

  @ManyToOne(() => Room, room => room.Chairs)
  Room: Room;

  @OneToMany(() => Appointment, appointment => appointment.Chair)
  Appointments: Appointment[];
}
