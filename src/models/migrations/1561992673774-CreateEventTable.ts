import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateEventTable1561992673774 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "start_type" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE NOT NULL, "type" character varying NOT NULL, "location" character varying NOT NULL, "visibility" character varying NOT NULL DEFAULT 'private', CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "events"`);
    }

}
