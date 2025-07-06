import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductUsage } from './product-usage.entity';

@Entity('Products')
export class Product {
  @PrimaryGeneratedColumn()
  productId: number;

  @Column()
  productName: string;

  @Column()
  category: string;

  @Column()
  quantityInStock: number;

  @Column()
  unit: string;

  @Column('decimal')
  price: number;

  @OneToMany(() => ProductUsage, usage => usage.product)
  productUsages: ProductUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
