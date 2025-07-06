import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Appointment } from './appointment.entity';

@Entity('ProductUsage')
export class ProductUsage {
  @PrimaryGeneratedColumn()
  usageId: number;

  @Column()
  quantityUsed: number;

  @Column()
  usedAt: Date;

  @ManyToOne(() => Product, product => product.productUsages)
  product: Product;

  @Column()
  productId: number;

  @ManyToOne(() => Appointment, appointment => appointment.productUsages)
  appointment: Appointment;

  @Column()
  appointmentId: number;
}
