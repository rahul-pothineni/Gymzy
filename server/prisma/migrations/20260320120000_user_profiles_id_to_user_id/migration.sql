-- Rename primary key column to match Prisma model field `user_id`
ALTER TABLE "user_profiles" RENAME COLUMN "id" TO "user_id";
