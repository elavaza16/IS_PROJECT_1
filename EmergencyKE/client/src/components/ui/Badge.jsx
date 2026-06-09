const LABELS = {
  pending:   "Pending",
  active:    "Active",
  resolved:  "Resolved",
  rejected:  "Rejected",
  suspended: "Suspended",
};

export default function Badge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}