import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateEventAttendeeTable1562001176039 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "event_attendees" ("event_id" integer NOT NULL, "user_id" integer NOT NULL, "role" character varying NOT NULL DEFAULT 'admin', "status" character varying NOT NULL DEFAULT 'going', CONSTRAINT "PK_feec393bf33d7694dcde8da98e0" PRIMARY KEY ("event_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff98c4d7c3e85237115140cf69" ON "event_attendees" ("user_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_ff98c4d7c3e85237115140cf69"`);
        await queryRunner.query(`DROP TABLE "event_attendees"`);
    }

}
