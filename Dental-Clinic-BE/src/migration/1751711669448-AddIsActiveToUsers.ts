import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveToUsers1751711669448 implements MigrationInterface {
    name = 'AddIsActiveToUsers1751711669448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "IsActive" bit NOT NULL CONSTRAINT "DF_a76983de563dcec678b5d869aa7" DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP CONSTRAINT "DF_a76983de563dcec678b5d869aa7"`);
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "IsActive"`);
    }

}
