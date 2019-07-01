import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateCalendarTable1561988761521 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "calendars" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "color" character varying NOT NULL DEFAULT '#5abc95', "time_slot_preferences" text NOT NULL DEFAULT '{"party":[[10,7,5,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,3,3],[3,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,8,10,10,10,10],[10,10,8,7,5,2,1,1,1,1,1,1,1,1,1,1,1,1,10,10,10,10,10,10]],"work":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,5,10,10,10,10,10,10,10,10,10,8,3,1,1,1,1,1],[1,1,1,1,1,1,1,5,10,10,10,10,10,10,10,10,10,8,3,1,1,1,1,1],[1,1,1,1,1,1,1,5,10,10,10,10,10,10,10,10,10,8,3,1,1,1,1,1],[1,1,1,1,1,1,1,5,10,10,10,10,10,10,10,10,10,8,3,1,1,1,1,1],[1,1,1,1,1,1,1,5,10,10,10,10,10,10,10,10,10,8,3,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]],"hobby":[[1,1,1,1,1,1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,3,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,5,5,5,3,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,5,5,5,3,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,5,5,5,3,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,5,5,5,3,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,5,5,5,3,1],[1,1,1,1,1,1,1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,3,1]],"workout":[[1,1,1,1,1,1,1,1,1,1,10,10,10,10,10,10,10,10,10,10,1,1,1,1],[1,1,1,1,1,1,3,3,1,1,1,1,5,5,5,1,1,1,10,10,8,5,1,1],[1,1,1,1,1,1,3,3,1,1,1,1,5,5,5,1,1,1,10,10,8,5,1,1],[1,1,1,1,1,1,3,3,1,1,1,1,5,5,5,1,1,1,10,10,8,5,1,1],[1,1,1,1,1,1,3,3,1,1,1,1,5,5,5,1,1,1,10,10,8,5,1,1],[1,1,1,1,1,1,3,3,1,1,1,1,5,5,5,1,1,1,10,10,8,5,1,1],[1,1,1,1,1,1,1,1,1,1,10,10,10,10,10,10,10,10,10,10,1,1,1,1]]}', CONSTRAINT "PK_90dc0330e8ec9028e23c290dee8" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "calendars"`);
    }

}