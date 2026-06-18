import { NextResponse } from "next/server";
import { phase21ActivationDeploymentPackage } from "@/lib/adminPermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    action: "admin-permissions-phase21-deployment-package",
    ...phase21ActivationDeploymentPackage(),
    note: "Read-only Phase 21 deployment package. This endpoint does not enable enforcement, write environment variables, edit users, expose passwords, impersonate users, call Clio, send email, generate documents, or change the print queue.",
  });
}
