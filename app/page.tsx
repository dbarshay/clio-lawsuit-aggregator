export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <section
          style={{
            marginBottom: 20,
            padding: 20,
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <h1 style={{ fontSize: 28, margin: "0 0 8px 0" }}>
            Clio Lawsuit Aggregator
          </h1>

          <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
            Lawsuit aggregation, document finalization, and local print queue workflow.
            Clio remains the source of truth for matter data and final document records.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <a href="/lawsuits" style={cardStyle}>
            <div style={cardTitleStyle}>Lawsuit Aggregation</div>
            <div style={cardBodyStyle}>
              Search Clio-indexed matters, review lawsuit groups, aggregate matters, and open matter-level workflows.
            </div>
          </a>

          <a href="/print-queue" style={cardStyle}>
            <div style={cardTitleStyle}>Daily Print Queue</div>
            <div style={cardBodyStyle}>
              View local print queue records, filter by status, and mark documents as printed, held, skipped, or queued.
            </div>
          </a>
        </section>

        <section
          style={{
            marginTop: 20,
            padding: 14,
            border: "1px solid #bfdbfe",
            borderRadius: 8,
            background: "#eff6ff",
            color: "#1e3a8a",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          <strong>Safety model:</strong> Preview and print queue actions are workflow-only unless explicitly finalized.
          Final record copies belong in the Clio master matter Documents tab.
        </section>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  display: "block",
  padding: 18,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  color: "#0f172a",
  textDecoration: "none",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  marginBottom: 8,
};

const cardBodyStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.5,
};
