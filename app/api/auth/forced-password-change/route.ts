import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createMatterAuditLogEntry } from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19,
  adminUserPasswordMatchesPhase19,
  adminUserPasswordPolicyErrorsPhase19,
  buildAdminUserPasswordChangeDataPhase19,
} from "@/src/lib/auth/admin-user-password-auth-runtime-phase19";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ForcedPasswordChangeBody = {
  email?: unknown;
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ForcedPasswordChangeBody;
    const email = cleanEmail(body.email);
    const currentPassword = cleanString(body.currentPassword);
    const newPassword = cleanString(body.newPassword);
    const confirmPassword = cleanString(body.confirmPassword);

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: "Email, current temporary password, new password, and confirm password are required." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: "New password and confirm password do not match." }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        locked: true,
        inactive: true,
        passwordHash: true,
        passwordHistoryJson: true,
        forcePasswordChange: true,
        passwordChangeRequired: true,
      },
    });

    if (!user || user.status !== "active" || user.locked || user.inactive) {
      return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: "Active admin user required." }, { status: 403 });
    }
    if (!user.forcePasswordChange && !user.passwordChangeRequired) {
      return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: "Forced password change is not required for this user." }, { status: 400 });
    }
    if (!adminUserPasswordMatchesPhase19(currentPassword, user.passwordHash)) {
      return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: "Current temporary password is incorrect." }, { status: 403 });
    }

    const policyErrors = adminUserPasswordPolicyErrorsPhase19(newPassword, user.passwordHistoryJson);
    if (policyErrors.length > 0) {
      return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: "New password does not meet password policy.", passwordPolicyErrors: policyErrors }, { status: 400 });
    }

    const updateData = buildAdminUserPasswordChangeDataPhase19(user.passwordHistoryJson, newPassword);
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.adminUser.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          displayName: true,
          forcePasswordChange: true,
          passwordChangeRequired: true,
          passwordSetAt: true,
        },
      });

      await createMatterAuditLogEntry({
        action: "admin-user-forced-password-change",
        summary: `Forced password change completed for admin user ${user.email}.`,
        entityType: "admin_user",
        fieldName: "AdminUser.passwordHash",
        priorValue: user.passwordHash ? "[existing non-recoverable hash]" : null,
        newValue: {
          passwordHashChanged: true,
          forcePasswordChangeCleared: true,
          passwordChangeRequiredCleared: true,
          passwordHistoryUpdated: true,
          plaintextPasswordLogged: false,
          source: ADMIN_USER_PASSWORD_AUTH_RUNTIME_PHASE19,
          targetUserId: user.id,
        } as Prisma.InputJsonValue,
      });

      return saved;
    });

    return NextResponse.json({
      ok: true,
      action: "admin-user-forced-password-change",
      user: updated,
      plaintextPasswordLogged: false,
      redirectTo: "/admin",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, action: "admin-user-forced-password-change", error: error instanceof Error ? error.message : "Forced password-change route failed." }, { status: 500 });
  }
}
