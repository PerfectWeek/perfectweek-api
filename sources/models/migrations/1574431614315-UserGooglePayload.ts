import { MigrationInterface, QueryRunner } from "typeorm";

export class UserGooglePayload1574431614315 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "users" ADD "google_provider_payload" json DEFAULT null`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "ciphered_password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "ciphered_password" SET DEFAULT null`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "ciphered_password" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "ciphered_password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_provider_payload"`);
    }

}
