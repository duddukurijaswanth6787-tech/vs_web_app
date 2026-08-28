-- Cash taken out of or put into the drawer during a shift for something other
-- than a sale. Needed so the expected cash at close matches what is counted.
CREATE TABLE IF NOT EXISTS "pos_cash_movements" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_cash_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pos_cash_movements_shiftId_idx" ON "pos_cash_movements"("shiftId");
CREATE INDEX IF NOT EXISTS "pos_cash_movements_terminalId_idx" ON "pos_cash_movements"("terminalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_cash_movements_shiftId_fkey'
  ) THEN
    ALTER TABLE "pos_cash_movements"
      ADD CONSTRAINT "pos_cash_movements_shiftId_fkey"
      FOREIGN KEY ("shiftId") REFERENCES "pos_shifts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
