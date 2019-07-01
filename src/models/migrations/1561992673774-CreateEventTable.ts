import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateEventTable1561992673774 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying DEFAULT null, "start_type" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "type" character varying NOT NULL, "location" character varying DEFAULT null, "visibility" character varying NOT NULL DEFAULT 'private', "color" character varying NOT NULL DEFAULT '#5abc95', CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "events"`);
    }

}
