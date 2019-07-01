import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateCalendarMemberTable1561989840618 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "calendar_members" ("user_id" integer NOT NULL, "calendar_id" integer NOT NULL, "role" character varying NOT NULL DEFAULT 'admin', "invitation_confirmed" boolean NOT NULL, CONSTRAINT "PK_6c55288de638f693364bf00404f" PRIMARY KEY ("user_id", "calendar_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4b8788ccd1a51d2e877dd41423" ON "calendar_members" ("calendar_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_4b8788ccd1a51d2e877dd41423"`);
        await queryRunner.query(`DROP TABLE "calendar_members"`);
    }

}
