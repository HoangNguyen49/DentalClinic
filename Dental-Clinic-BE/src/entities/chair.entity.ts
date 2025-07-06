import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Room } from './room.entity';
import { Appointment } from './appointment.entity';

@Entity('Chairs')
export class Chair {
  @PrimaryGeneratedColumn()
  chairId: number;

  @Column()
  chairNumber: string;

  @Column()
  roomId: number;

  @ManyToOne(() => Room, room => room.chairs)
  room: Room;

  @OneToMany(() => Appointment, appointment => appointment.chair)
  appointments: Appointment[];
}
