"use client";

import React from "react";
import BarshHeaderQuickNav from "@/app/components/BarshHeaderQuickNav";
import BarshHeaderActions from "@/app/components/BarshHeaderActions";

// Single source of truth for the standard Barsh Matters page header.
//
// Layout is a 3-column grid:
//   - Column 1 (left, anchored):  BRL logo + quick-nav search
//   - Column 2 (center, flexible): page-specific content (e.g. file number / matter info)
//   - Column 3 (right, anchored): header actions + Barsh Matters logo (links home)
//
// The left and right clusters stay anchored on every page; only the `center` slot varies.
// Pass `center` for page-specific middle content, and `onAdministratorClick` when a page
// wants to intercept the Administrator action (otherwise it navigates to /admin).

type BarshHeaderProps = {
  center?: React.ReactNode;
  onAdministratorClick?: () => void;
};

const headerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 10,
  isolation: "isolate",
  display: "grid",
  gridTemplateColumns: "500px minmax(0, 1fr) 330px",
  alignItems: "start",
  gap: 16,
  minHeight: 124,
  padding: "6px 0 4px",
  marginBottom: 6,
  background: "#f8fafc",
  boxShadow: "none",
  borderBottom: "none",
};

const leftLogoWrapStyle: React.CSSProperties = {
  gridColumn: "1",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
};

const centerSlotStyle: React.CSSProperties = {
  gridColumn: "2",
  minWidth: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

const rightTopWrapStyle: React.CSSProperties = {
  gridColumn: "3",
  justifySelf: "end",
  position: "relative",
  width: 520,
  height: 132,
  display: "block",
};

const brlLogoStyle: React.CSSProperties = {
  width: 190,
  height: 126,
  objectFit: "contain",
  display: "block",
};

const printButtonRowStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 304,
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 8,
  flexWrap: "nowrap",
  zIndex: 2,
};

const bmLogoLinkStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  display: "inline-flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  textDecoration: "none",
  width: 292,
  height: 132,
  flexShrink: 0,
  zIndex: 1,
};

const bmLogoStyle: React.CSSProperties = {
  width: 292,
  height: 132,
  minWidth: 292,
  objectFit: "contain",
  objectPosition: "right top",
  display: "block",
  flexShrink: 0,
};

export default function BarshHeader({ center, onAdministratorClick }: BarshHeaderProps) {
  return (
    <section style={headerStyle} data-barsh-standard-header="true">
      <div style={leftLogoWrapStyle}>
        <img src="/brl-logo.png" alt="BRL Logo" style={brlLogoStyle} />
        <div style={{ paddingTop: 8 }}>
          <BarshHeaderQuickNav />
        </div>
      </div>

      <div style={centerSlotStyle} data-barsh-standard-header-center="true">
        {center}
      </div>

      <div style={rightTopWrapStyle}>
        <div style={{ ...printButtonRowStyle, position: "relative" }}>
          <BarshHeaderActions onAdministratorClick={onAdministratorClick} />
        </div>

        <a href="/" style={bmLogoLinkStyle} title="Return to Barsh Matters entry screen">
          <img src="/barsh-matters-cropped-transparent.png" alt="Barsh Matters Logo" style={bmLogoStyle} />
        </a>
      </div>
    </section>
  );
}
