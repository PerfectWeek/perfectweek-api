import {MigrationInterface, QueryRunner} from "typeorm";

export class CreatePendingUserTable1561657121579 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "pending_users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "ciphered_password" character varying NOT NULL, "uuid" character varying NOT NULL, CONSTRAINT "PK_4dcd5954b4aecb4d483a5c7e7d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_52d88bd887025f9814da7d2845" ON "pending_users" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_eb3fc31eac01a8c2ff01d522db" ON "pending_users" ("uuid") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_eb3fc31eac01a8c2ff01d522db"`);
        await queryRunner.query(`DROP INDEX "IDX_52d88bd887025f9814da7d2845"`);
        await queryRunner.query(`DROP TABLE "pending_users"`);
    }

}
