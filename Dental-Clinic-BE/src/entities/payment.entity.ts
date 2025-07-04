import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('Payments')
export class Payment {
  @PrimaryGeneratedColumn()
  PaymentId: number;

  @Column('decimal')
  Amount: number;

  @Column()
  PaymentMethod: string;

  @Column()
  PaymentDate: Date;

  @Column({ nullable: true })
  Note: string;

  @ManyToOne(() => Invoice, invoice => invoice.Payments)
  Invoice: Invoice;

  @Column()
  InvoiceId: number;
}
