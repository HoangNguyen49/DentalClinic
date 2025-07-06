import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('Payments')
export class Payment {
  @PrimaryGeneratedColumn()
  paymentId: number;

  @Column('decimal')
  amount: number;

  @Column()
  paymentMethod: string;

  @Column()
  paymentDate: Date;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => Invoice, invoice => invoice.payments)
  invoice: Invoice;

  @Column()
  invoiceId: number;
}
