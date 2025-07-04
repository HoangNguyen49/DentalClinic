import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Appointment } from './appointment.entity';

@Entity('ProductUsage')
export class ProductUsage {
  @PrimaryGeneratedColumn()
  UsageId: number;

  @Column()
  QuantityUsed: number;

  @Column()
  UsedAt: Date;

  @ManyToOne(() => Product, product => product.ProductUsages)
  Product: Product;

  @Column()
  ProductId: number;

  @ManyToOne(() => Appointment, appointment => appointment.ProductUsages)
  Appointment: Appointment;

  @Column()
  AppointmentId: number;
}
