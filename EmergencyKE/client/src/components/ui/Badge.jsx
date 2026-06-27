const LABELS = {
  // user / volunteer statuses
  pending:     "Pending",
  active:      "Active",
  resolved:    "Resolved",
  rejected:    "Rejected",
  suspended:   "Suspended",
  // incident statuses
  reported:    "Reported",
  dispatching: "Dispatching",
  in_progress: "In Progress",
  cancelled:   "Cancelled",
};

export default function Badge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}