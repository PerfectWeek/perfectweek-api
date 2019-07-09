import {MigrationInterface, QueryRunner} from "typeorm";

export class EventTableFixTypo1562660302582 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "start_type" TO "start_time"`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "start_time" TO "start_type"`);
    }

}
