export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

const SLA_HOURS: Record<
  TicketPriority,
  {
    response: number;
    resolution: number;
  }
> = {
  LOW: {
    response: 24,
    resolution: 72,
  },
  MEDIUM: {
    response: 12,
    resolution: 48,
  },
  HIGH: {
    response: 4,
    resolution: 24,
  },
  URGENT: {
    response: 1,
    resolution: 8,
  },
};

export function calculateSLA(
  priority: TicketPriority,
  createdAt: Date = new Date()
) {
  const config = SLA_HOURS[priority] ?? SLA_HOURS.MEDIUM;

  const responseDueAt = new Date(
    createdAt.getTime() +
      config.response * 60 * 60 * 1000
  );

  const resolutionDueAt = new Date(
    createdAt.getTime() +
      config.resolution * 60 * 60 * 1000
  );

  return {
    responseDueAt,
    resolutionDueAt,
  };
}

export function isOverdue(
  dueAt?: Date | string | null
) {
  if (!dueAt) {
    return false;
  }

  return new Date(dueAt).getTime() < Date.now();
}

export function getTicketAge(
  createdAt: Date | string
) {
  const created = new Date(createdAt).getTime();
  const now = Date.now();

  const milliseconds = Math.max(0, now - created);

  const minutes = Math.floor(
    milliseconds / (1000 * 60)
  );

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
}

export function getSLAStatus(
  resolutionDueAt?: Date | string | null,
  status?: string
) {
  if (
    status === "RESOLVED" ||
    status === "CLOSED"
  ) {
    return "COMPLETED";
  }

  if (isOverdue(resolutionDueAt)) {
    return "OVERDUE";
  }

  return "ON_TRACK";
}
