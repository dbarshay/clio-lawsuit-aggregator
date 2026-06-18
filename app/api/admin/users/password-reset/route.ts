import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { createMatterAuditLogEntry } from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function isApplyRequested(value: unknown): boolean {
  return value === true || value === "true" || value === "apply";
}

function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push("Password must be at least 10 characters.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must include at least one lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include at least one number.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must include at least one symbol.");
  return errors;
}

async function activeOwnerAdminActor(actorEmail: string) {
  if (!actorEmail) return null;

  return prisma.adminUser.findFirst({
    where: {
      email: actorEmail,
      status: "active",
      roles: {
        some: {
          role: {
            key: "owner_admin",
            status: "active",
          },
        },
      },
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
      permissionOverrides: true,
    },
  });
}

function effectivePermissionKeysForUser(user: any): string[] {
  const rolePermissionKeys = Array.from(
    new Set(
      (user?.roles || []).flatMap((entry: any) =>
        entry?.role?.status === "active"
          ? (entry.role.permissions || []).map((permission: any) => permission.permissionKey)
          : []
      )
    )
  ).sort();

  const explicitOverrides = user?.permissionOverrides || [];
  const explicitBlocks = new Set(
    explicitOverrides
      .filter((entry: any) => entry.action === "block")
      .map((entry: any) => entry.permissionKey)
  );
  const explicitAllows = explicitOverrides
    .filter((entry: any) => entry.action === "allow")
    .map((entry: any) => entry.permissionKey);

  return Array.from(
    new Set([...rolePermissionKeys.filter((permissionKey: any) => !explicitBlocks.has(permissionKey)), ...explicitAllows])
  ).sort() as string[];
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: "blocked",
          error: "Authenticated administrator session required.",
          enforcementChanged: false,
          passwordExposed: false,
          impersonationEnabled: false,
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const apply = isApplyRequested(body?.apply);
    const actorEmail = cleanEmail(body?.actorEmail);
    const targetEmail = cleanEmail(body?.targetEmail ?? body?.email);
    const temporaryPassword = cleanString(body?.temporaryPassword);
    const reason = cleanString(body?.reason);

    if (!actorEmail) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "actorEmail is required so the route can verify an active owner_admin actor before any password reset.",
          enforcementChanged: false,
          passwordExposed: false,
          impersonationEnabled: false,
        },
        { status: 400 }
      );
    }

    const actor = await activeOwnerAdminActor(actorEmail);
    if (!actor) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "Active owner_admin actor required.",
          actorEmail,
          enforcementChanged: false,
          passwordExposed: false,
          impersonationEnabled: false,
        },
        { status: 403 }
      );
    }

    const actorEffectivePermissionKeys = effectivePermissionKeysForUser(actor);

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "A valid target admin user email is required.",
          actorEmail,
          actorRoleRequired: "owner_admin",
          actorEffectivePermissionCount: actorEffectivePermissionKeys.length,
          enforcementChanged: false,
          passwordExposed: false,
          impersonationEnabled: false,
        },
        { status: 400 }
      );
    }

    if (!reason || reason.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "An explicit reason of at least 6 characters is required for a password reset.",
          actorEmail,
          enforcementChanged: false,
          passwordExposed: false,
          impersonationEnabled: false,
        },
        { status: 400 }
      );
    }

    const policyErrors = passwordPolicyErrors(temporaryPassword);
    if (policyErrors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "Temporary password does not meet the Phase 12D password policy.",
          passwordPolicyErrors: policyErrors,
          policy: {
            minimumLength: 10,
            requiresUppercase: true,
            requiresLowercase: true,
            requiresNumber: true,
            requiresSymbol: true,
          },
          actorEmail,
          enforcementChanged: false,
          passwordExposed: false,
          passwordReturned: false,
          impersonationEnabled: false,
        },
        { status: 400 }
      );
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { email: targetEmail },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-password-reset",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "Target admin user does not exist.",
          targetEmail,
          actorEmail,
          enforcementChanged: false,
          passwordExposed: false,
          passwordReturned: false,
          impersonationEnabled: false,
        },
        { status: 404 }
      );
    }

    const preview = {
      id: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.displayName,
      username: targetUser.username,
      status: targetUser.status,
      bootstrapSafe: targetUser.bootstrapSafe,
      roleKeys: targetUser.roles.map((entry: any) => entry.role.key).sort(),
      passwordHashWillChange: true,
      passwordChangeRequiredWillBe: true,
      failedLoginCountWillReset: true,
      passwordReturned: false,
      passwordExposed: false,
      impersonationEnabled: false,
      enforcementChanged: false,
      note: "Temporary password is accepted from the owner/admin, hashed immediately on apply, and never returned by this route.",
    };

    if (!apply) {
      return NextResponse.json({
        ok: true,
        action: "admin-user-password-reset",
        mode: "preview",
        previewOnly: true,
        applyRequiredForWrite: true,
        wouldReset: preview,
        actorEmail,
        actorRoleRequired: "owner_admin",
        actorEffectivePermissionCount: actorEffectivePermissionKeys.length,
        enforcementChanged: false,
        passwordExposed: false,
        passwordReturned: false,
        impersonationEnabled: false,
        note: "Preview only. No password hash, credential, username, user status, permission enforcement setting, Clio record, document, email, or print queue item was changed.",
      });
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.adminUser.update({
        where: { id: targetUser.id },
        data: {
          passwordHash,
          passwordSetAt: new Date(),
          passwordChangeRequired: true,
          failedLoginCount: 0,
          lastFailedLoginAt: null,
          notes: targetUser.notes
            ? `${targetUser.notes}\n[${new Date().toISOString()}] PASSWORD RESET by ${actorEmail}: ${reason}`
            : `[${new Date().toISOString()}] PASSWORD RESET by ${actorEmail}: ${reason}`,
        },
      });

      await createMatterAuditLogEntry({
        action: "admin-user-password-reset",
        summary: `Reset password for admin user ${targetUser.email}.`,
        entityType: "admin_user",
        fieldName: "AdminUser.passwordHash",
        priorValue: targetUser.passwordHash ? "[existing non-recoverable hash]" : null,
        newValue: "[new non-recoverable hash]",
        details: {
          route: "/api/admin/users/password-reset",
          mode: "apply",
          targetUserId: targetUser.id,
          targetEmail: targetUser.email,
          reason,
          passwordHashChanged: true,
          passwordChangeRequired: true,
          failedLoginCountReset: true,
          temporaryPasswordStored: false,
          temporaryPasswordReturned: false,
          passwordExposed: false,
          impersonationEnabled: false,
          enforcementChanged: false,
        },
        sourcePage: "/admin/users",
        workflow: "admin-users-phase12k",
        actorName: actor.displayName || "Administrator",
        actorEmail,
      });

      return user;
    });

    return NextResponse.json({
      ok: true,
      action: "admin-user-password-reset",
      mode: "apply",
      updated: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        username: updated.username,
        status: updated.status,
        bootstrapSafe: updated.bootstrapSafe,
        passwordSetAt: updated.passwordSetAt,
        passwordChangeRequired: updated.passwordChangeRequired,
        failedLoginCount: updated.failedLoginCount,
      },
      actorEmail,
      actorRoleRequired: "owner_admin",
      actorEffectivePermissionCount: actorEffectivePermissionKeys.length,
      passwordHashChanged: true,
      passwordChangeRequired: true,
      passwordExposed: false,
      passwordReturned: false,
      impersonationEnabled: false,
      enforcementChanged: false,
      note: "Password reset complete. The password was hashed immediately and was not returned. User must change password on first login once the password-change flow is active.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "admin-user-password-reset",
        mode: "error",
        error: error?.message || "Admin user password reset route failed.",
        enforcementChanged: false,
        passwordExposed: false,
        impersonationEnabled: false,
      },
      { status: 500 }
    );
  }
}
