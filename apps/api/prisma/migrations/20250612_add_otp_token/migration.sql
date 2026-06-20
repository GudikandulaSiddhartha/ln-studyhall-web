-- Make userId optional for guest bookings
ALTER TABLE "Booking" ALTER COLUMN "userId" DROP NOT NULL;

-- Add notes field to store guest name + phone as JSON
ALTER TABLE "Booking" ADD COLUMN "notes" TEXT;

-- Update foreign key to SET NULL instead of CASCADE when user is deleted
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_userId_fkey";
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
