ALTER TABLE "SessionParticipant" RENAME COLUMN "rebuys" TO "buy_ins";
ALTER TABLE "SessionParticipant" ALTER COLUMN "buy_ins" SET DEFAULT 1;
