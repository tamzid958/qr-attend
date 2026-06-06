-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SCANNER');

-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('REGISTERED', 'INVITED', 'PRESENT', 'ABSENT');

-- CreateTable
CREATE TABLE "User" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash"  TEXT NOT NULL,
    "role"          "Role" NOT NULL DEFAULT 'SCANNER',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id"        TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate"   TIMESTAMP(3) NOT NULL,
    "location"  TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventScanner" (
    "id"      TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId"  TEXT NOT NULL,
    CONSTRAINT "EventScanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "phone"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "id"          TEXT NOT NULL,
    "eventId"     TEXT NOT NULL,
    "attendeeId"  TEXT NOT NULL,
    "status"      "AttendeeStatus" NOT NULL DEFAULT 'REGISTERED',
    "uniqueToken" TEXT NOT NULL,
    "shortCode"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id"              TEXT NOT NULL,
    "eventAttendeeId" TEXT NOT NULL,
    "scannedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy"       TEXT NOT NULL,
    "gateName"        TEXT NOT NULL,
    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventScanner_eventId_userId_key" ON "EventScanner"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_email_key" ON "Attendee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_uniqueToken_key" ON "EventAttendee"("uniqueToken");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_shortCode_key" ON "EventAttendee"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_eventId_attendeeId_key" ON "EventAttendee"("eventId", "attendeeId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "EventScanner" ADD CONSTRAINT "EventScanner_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventScanner" ADD CONSTRAINT "EventScanner_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_attendeeId_fkey"
    FOREIGN KEY ("attendeeId") REFERENCES "Attendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_eventAttendeeId_fkey"
    FOREIGN KEY ("eventAttendeeId") REFERENCES "EventAttendee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_scannedBy_fkey"
    FOREIGN KEY ("scannedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
