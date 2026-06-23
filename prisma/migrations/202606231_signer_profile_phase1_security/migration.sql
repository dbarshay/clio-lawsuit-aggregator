-- Admin Users / Signer Profile Phase 1
-- Adds nullable/defaulted signer, identity, password-security, 2FA, signout, and idle-timeout fields.
-- Safe additive migration. Passwords and 2FA codes are never stored in plaintext.

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "emailNormalized" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "usernameNormalized" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "phoneExtension" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "faxNumber" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "signatureBlockName" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "inactive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "failedLoginLockedAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "passwordHistoryJson" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorPhone" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorPhoneMasked" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorDisabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorPendingSetup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorChallengeHash" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorChallengeExpiresAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorChallengeAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "twoFactorChallengeLockedAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lastSignOutAt" TIMESTAMP(3);
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "sessionInvalidatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_emailNormalized_key" ON "AdminUser"("emailNormalized") WHERE "emailNormalized" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_usernameNormalized_key" ON "AdminUser"("usernameNormalized") WHERE "usernameNormalized" IS NOT NULL;
