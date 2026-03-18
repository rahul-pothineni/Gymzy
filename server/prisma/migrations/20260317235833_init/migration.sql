-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "goal" VARCHAR(20) NOT NULL,
    "experience" VARCHAR(20) NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "minutesPerDay" INTEGER NOT NULL,
    "split" VARCHAR(20) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);
