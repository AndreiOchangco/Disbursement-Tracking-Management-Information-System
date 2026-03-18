export default function Research() {
  return (
    <div>
      <div className="page-header">
        <h2>Research Reference</h2>
        <p>This project is based on research-methods principles for system design.</p>
      </div>
      <section className="panel">
        <h3>Key design principles from research</h3>
        <ul>
          <li>Clarify problem statement and stakeholder requirements.</li>
          <li>Use data-driven workflow to track disbursement life cycle.</li>
          <li>Maintain auditability, accountability, and approval traceability.</li>
          <li>Prioritize usability for role-based stakeholders.</li>
        </ul>
      </section>
      <section className="panel">
        <h3>How this app applies research methods</h3>
        <ul>
          <li>Defines actors and role-based dashboards (System Admin, Accountant, etc.).</li>
          <li>Implements modular workflow pages for disbursement requests and detail review.</li>
          <li>Stores state in localStorage to preserve user and request data during research prototyping.</li>
          <li>Provides clear navigation and simple controls for iterative evaluation.</li>
        </ul>
      </section>
      <p>For final integration, replace these guidelines with exact chapter recommendations from the project reference paper.</p>
    </div>
  )
}
