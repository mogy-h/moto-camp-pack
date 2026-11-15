-- CreateTable
CREATE TABLE "suggestion_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suggestion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suggestion_logs_user_id_created_at_idx" ON "suggestion_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "suggestion_logs" ADD CONSTRAINT "suggestion_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
