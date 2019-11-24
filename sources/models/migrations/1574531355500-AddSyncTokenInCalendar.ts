import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSyncTokenInCalendar1574531355500 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "calendars" ADD "google_calendar_sync_token" character varying DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "ciphered_password" SET DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "google_provider_payload" SET DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "google_provider_payload" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "ciphered_password" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "calendars" DROP COLUMN "google_calendar_sync_token"`);
    }

}
