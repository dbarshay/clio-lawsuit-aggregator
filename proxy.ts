import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTHORIZE_PATH, adminUnauthorizedJson, isAdminRequestAuthorized } from "@/lib/adminAuth";
import { adminPermissionEnforcementDecision } from "@/lib/adminPermissions";

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isAdminPageRequest = pathname.startsWith("/admin");
  const isAdminApiRequest = pathname.startsWith("/api/admin");

  if (!isAdminPageRequest && !isAdminApiRequest) {
    return NextResponse.next();
  }

  if (pathname === ADMIN_AUTHORIZE_PATH) {
    return NextResponse.next();
  }

  if (isAdminRequestAuthorized(req)) {
    const permissionDecision = adminPermissionEnforcementDecision(pathname, isAdminApiRequest ? req.method : "GET");

    if (isAdminApiRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked) {
      return NextResponse.json(
        {
          ok: false,
          action: "admin-api-permission-blocked",
          authorized: true,
          permission: permissionDecision.permission,
          decision: permissionDecision,
          error: "Admin API route is blocked by current admin permission overrides.",
        },
        { status: 403 }
      );
    }

    if (isAdminPageRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked) {
      const blockedUrl = req.nextUrl.clone();
      blockedUrl.pathname = "/admin/permissions";
      blockedUrl.search = "";
      blockedUrl.searchParams.set("blocked", "1");
      blockedUrl.searchParams.set("from", `${pathname}${req.nextUrl.search}`);
      if (permissionDecision.permission) blockedUrl.searchParams.set("permission", permissionDecision.permission);
      return NextResponse.redirect(blockedUrl);
    }

    return NextResponse.next();
  }

  if (isAdminApiRequest) {
    return adminUnauthorizedJson(401);
  }

  const redirectUrl = req.nextUrl.clone();
  const requestedPath = `${pathname}${req.nextUrl.search}`;
  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("from", requestedPath);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

