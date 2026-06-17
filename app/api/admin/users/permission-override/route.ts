import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { createMatterAuditLogEntry } from "@/lib/auditLog";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROUTE_PERMISSIONS, allAdminPermissionKeys, isAdminPermissionNeverBlockPath, isKnownAdminPermissionKey } from "@/lib/adminPermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function cleanPermissionKey(value: unknown): string {
  return cleanString(value);
}

function cleanOverrideAction(value: unknown): "allow" | "block" | "" {
  const action = cleanString(value).toLowerCase();
  return action === "allow" || action === "block" ? action : "";
}

function isApplyRequested(value: unknown): boolean {
  return value === true || value === "true" || value === "apply";
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

function neverBlockPermissionKeys() {
  return Array.from(
    new Set(
      ADMIN_ROUTE_PERMISSIONS.filter((route) => isAdminPermissionNeverBlockPath(route.pattern)).map((route) => route.permission)
    )
  ).sort();
}

function neverBlockRoutesForPermission(permissionKey: string) {
  return ADMIN_ROUTE_PERMISSIONS.filter((route) => route.permission === permissionKey && isAdminPermissionNeverBlockPath(route.pattern)).map((route) => ({
    pattern: route.pattern,
    method: route.method || "ANY",
    accessType: route.accessType,
    permission: route.permission,
  }));
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: "blocked",
          error: "Authenticated administrator session required.",
          enforcementChanged: false,
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const apply = isApplyRequested(body?.apply);
    const actorEmail = cleanEmail(body?.actorEmail);
    const targetEmail = cleanEmail(body?.targetEmail ?? body?.email);
    const permissionKey = cleanPermissionKey(body?.permissionKey ?? body?.permission);
    const overrideAction = cleanOverrideAction(body?.overrideAction ?? body?.action);
    const reason = cleanString(body?.reason);

    if (!actorEmail) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "actorEmail is required so the route can verify an active owner_admin actor before any write.",
          enforcementChanged: false,
        },
        { status: 400 }
      );
    }

    const actor = await activeOwnerAdminActor(actorEmail);
    if (!actor) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "Active owner_admin actor required.",
          actorEmail,
          enforcementChanged: false,
        },
        { status: 403 }
      );
    }

    const actorEffectivePermissionKeys = effectivePermissionKeysForUser(actor);

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "A valid target admin user email is required.",
          actorEmail,
          actorRoleRequired: "owner_admin",
          actorEffectivePermissionCount: actorEffectivePermissionKeys.length,
          enforcementChanged: false,
        },
        { status: 400 }
      );
    }

    if (!permissionKey || !isKnownAdminPermissionKey(permissionKey)) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "A known admin permission key is required.",
          permissionKey,
          knownPermissionKeys: allAdminPermissionKeys(),
          actorEmail,
          enforcementChanged: false,
        },
        { status: 400 }
      );
    }

    if (!overrideAction) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "overrideAction must be allow or block.",
          permissionKey,
          actorEmail,
          enforcementChanged: false,
        },
        { status: 400 }
      );
    }

    if (!reason || reason.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "An explicit reason of at least 6 characters is required for any permission override.",
          permissionKey,
          overrideAction,
          actorEmail,
          enforcementChanged: false,
        },
        { status: 400 }
      );
    }

    const blockedNeverBlockRoutes = overrideAction === "block" ? neverBlockRoutesForPermission(permissionKey) : [];
    if (blockedNeverBlockRoutes.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "Blocking this permission is not allowed because it maps to administrator lockout safety routes.",
          permissionKey,
          overrideAction,
          neverBlockPermissionKeys: neverBlockPermissionKeys(),
          blockedNeverBlockRoutes,
          lockoutProtection: true,
          actorEmail,
          enforcementChanged: false,
        },
        { status: 409 }
      );
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { email: targetEmail },
      include: {
        permissionOverrides: true,
        roles: { include: { role: { include: { permissions: true } } } },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-user-permission-override",
          mode: apply ? "apply-blocked" : "preview-blocked",
          error: "Target admin user does not exist.",
          targetEmail,
          actorEmail,
          enforcementChanged: false,
        },
        { status: 404 }
      );
    }

    const existingOverride = targetUser.permissionOverrides.find((entry: any) => entry.permissionKey === permissionKey) || null;
    const preview = {
      userId: targetUser.id,
      email: targetUser.email,
      displayName: targetUser.displayName,
      userStatus: targetUser.status,
      bootstrapSafe: targetUser.bootstrapSafe,
      permissionKey,
      overrideAction,
      reason,
      existingOverride: existingOverride
        ? {
            id: existingOverride.id,
            permissionKey: existingOverride.permissionKey,
            action: existingOverride.action,
            reason: existingOverride.reason,
          }
        : null,
      writeMode: existingOverride ? "update-existing-override" : "create-new-override",
      neverBlockPermissionKeys: neverBlockPermissionKeys(),
      blockedNeverBlockRoutes,
    };

    if (!apply) {
      return NextResponse.json({
        ok: true,
        action: "admin-user-permission-override",
        mode: "preview",
        previewOnly: true,
        applyRequiredForWrite: true,
        wouldOverride: preview,
        actorEmail,
        actorRoleRequired: "owner_admin",
        actorEffectivePermissionCount: actorEffectivePermissionKeys.length,
        enforcementChanged: false,
        note: "Preview only. No AdminUserPermissionOverride row, role row, enforcement setting, Clio record, document, email, or print queue item was changed.",
      });
    }

    const override = await prisma.$transaction(async (tx) => {
      const saved = existingOverride
        ? await tx.adminUserPermissionOverride.update({
            where: { id: existingOverride.id },
            data: {
              action: overrideAction,
              reason,
            },
          })
        : await tx.adminUserPermissionOverride.create({
            data: {
              userId: targetUser.id,
              permissionKey,
              action: overrideAction,
              reason,
            },
          });

      await createMatterAuditLogEntry({
        action: "admin-user-permission-override",
        summary: `${existingOverride ? "Updated" : "Created"} ${overrideAction} override for ${permissionKey} on admin user ${targetUser.email}.`,
        entityType: "admin_user_permission_override",
        fieldName: "AdminUserPermissionOverride",
        priorValue: existingOverride
          ? {
              id: existingOverride.id,
              userId: existingOverride.userId,
              permissionKey: existingOverride.permissionKey,
              action: existingOverride.action,
              reason: existingOverride.reason,
            }
          : Prisma.JsonNull,
        newValue: {
          id: saved.id,
          userId: saved.userId,
          permissionKey: saved.permissionKey,
          action: saved.action,
          reason: saved.reason,
        },
        details: {
          route: "/api/admin/users/permission-override",
          mode: "apply",
          writeMode: existingOverride ? "update-existing-override" : "create-new-override",
          lockoutProtection: true,
          neverBlockPermissionKeys: neverBlockPermissionKeys(),
          blockedNeverBlockRoutes,
          enforcementChanged: false,
          rolesChanged: false,
        },
        sourcePage: "/admin/users",
        workflow: "admin-users-phase3",
        actorName: actor.displayName || "Administrator",
        actorEmail,
      });

      return saved;
    });

    return NextResponse.json({
      ok: true,
      action: "admin-user-permission-override",
      mode: "apply",
      override: {
        id: override.id,
        userId: override.userId,
        targetEmail: targetUser.email,
        permissionKey: override.permissionKey,
        action: override.action,
        reason: override.reason,
      },
      writeMode: existingOverride ? "update-existing-override" : "create-new-override",
      lockoutProtection: {
        neverBlockPermissionKeys: neverBlockPermissionKeys(),
        blockedNeverBlockRoutes,
        preserved: true,
      },
      rolesChanged: false,
      permissionOverrideChanged: true,
      actorEmail,
      actorRoleRequired: "owner_admin",
      actorEffectivePermissionCount: actorEffectivePermissionKeys.length,
      enforcementChanged: false,
      note: "Admin user permission override saved. Permission enforcement setting was not changed.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "admin-user-permission-override",
        mode: "error",
        error: error?.message || "Admin user permission override route failed.",
        enforcementChanged: false,
      },
      { status: 500 }
    );
  }
}
