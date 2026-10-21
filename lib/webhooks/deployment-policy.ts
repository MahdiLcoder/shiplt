const rank: Record<string, number> = { PENDING: 0, RUNNING: 1, SUCCEEDED: 2, FAILED: 2, CANCELLED: 2 };
const terminal = new Set(["SUCCEEDED", "FAILED", "CANCELLED"]);
export type DeploymentStatus = keyof typeof rank;

export function mayAdvanceDeployment(currentStatus: DeploymentStatus, latestEventAt: string | null, nextStatus: DeploymentStatus, occurredAt: string) {
  if (terminal.has(currentStatus)) return false;
  if ((rank[nextStatus] ?? -1) < (rank[currentStatus] ?? -1)) return false;
  if (latestEventAt && Date.parse(occurredAt) < Date.parse(latestEventAt)) return false;
  return true;
}
