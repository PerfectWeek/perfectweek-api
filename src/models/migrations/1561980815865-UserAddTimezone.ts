import {MigrationInterface, QueryRunner} from "typeorm";

export class UserAddTimezone1561980815865 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "users" ADD "timezone" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
    }

}
