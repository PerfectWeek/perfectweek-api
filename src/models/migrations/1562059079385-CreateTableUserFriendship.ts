import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTableUserFriendship1562059079385 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "user_frienships" ("requesting_id" integer NOT NULL, "requested_id" integer NOT NULL, "confirmed" boolean NOT NULL, CONSTRAINT "PK_a3b4bd59c301a86d6ffb7599278" PRIMARY KEY ("requesting_id", "requested_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c238976a3721b2e52b05d90029" ON "user_frienships" ("requested_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_c238976a3721b2e52b05d90029"`);
        await queryRunner.query(`DROP TABLE "user_frienships"`);
    }

}
