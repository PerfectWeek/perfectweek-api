import {MigrationInterface, QueryRunner} from "typeorm";

export class EventColor1562675901076 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "calendar_entries" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "color" character varying NOT NULL DEFAULT '#5abc95'`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "calendar_entries" ADD "color" character varying NOT NULL`);
    }

}
