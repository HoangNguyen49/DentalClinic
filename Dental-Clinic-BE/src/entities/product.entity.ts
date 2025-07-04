import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { ProductUsage } from './product-usage.entity';

@Entity('Products')
export class Product {
  @PrimaryGeneratedColumn()
  ProductId: number;

  @Column()
  ProductName: string;

  @Column()
  Category: string;

  @Column()
  QuantityInStock: number;

  @Column()
  Unit: string;

  @Column('decimal')
  Price: number;

  @OneToMany(() => ProductUsage, usage => usage.Product)
  ProductUsages: ProductUsage[];

  @CreateDateColumn()
  CreatedAt: Date;

  @UpdateDateColumn()
  UpdatedAt: Date;
}
