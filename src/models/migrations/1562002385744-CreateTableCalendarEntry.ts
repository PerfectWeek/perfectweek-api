import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTableCalendarEntry1562002385744 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "calendar_entries" ("calendar_id" integer NOT NULL, "event_id" integer NOT NULL, "color" character varying NOT NULL DEFAULT '#5abc95', CONSTRAINT "PK_1d5474d83332c38e3cf84485a37" PRIMARY KEY ("calendar_id", "event_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_651996a61c3b4ab03437047826" ON "calendar_entries" ("event_id") `);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "description" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "location" SET DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "location" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "description" DROP DEFAULT`);
        await queryRunner.query(`DROP INDEX "IDX_651996a61c3b4ab03437047826"`);
        await queryRunner.query(`DROP TABLE "calendar_entries"`);
    }

}
