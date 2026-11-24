import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  ExternalLink,
  Filter,
  HardDrive,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  fetchWorkspaceAuditTrail,
  fetchSystemApiLogs,
  type AuditLogEntry,
  type ApiLogEntry,
} from "@/lib/mockApi";

export function LogsViewerModal({
  isOpen,
  onClose,
  businessId,
  businessName,
}: {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}) {
  const [activeTab, setActiveTab] = useState<"audit" | "api">("audit");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditRes, apiRes] = await Promise.all([
        fetchWorkspaceAuditTrail(),
        fetchSystemApiLogs({ onlyErrors }),
      ]);
      setAuditLogs(auditRes);
      setApiLogs(apiRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, onlyErrors]);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="border-b border-white/[0.08] pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                  <Activity className="h-3 w-3" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                  SYSTEM TELEMETRY & AUDIT
                </span>
              </div>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                Activity Logs & API Logs
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Complete platform audit trail and system telemetry
              </DialogDescription>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <div className="flex items-center gap-2 p-1 bg-secondary/40 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "audit"
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Activity Audit Trail</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                  {auditLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("api")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "api"
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Server className="h-3.5 w-3.5" />
                <span>API & Error Logs</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                  {apiLogs.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "api" && (
                <button
                  type="button"
                  onClick={() => setOnlyErrors(!onlyErrors)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    onlyErrors
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold"
                      : "bg-secondary/40 border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Errors Only</span>
                </button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-8 text-xs gap-1 border-white/10 hover:bg-white/5"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {activeTab === "audit" ? (
            /* TAB 1: AUDIT TRAIL */
            auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-card/50 hover:bg-card/80 transition-all gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5 border border-cyan-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground capitalize">
                            {log.action.replace(".", " • ")}
                          </span>
                          {log.businessName && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
                              {log.businessName}
                            </span>
                          )}
                          {log.resourceType && (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {log.resourceType}
                            </span>
                          )}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono line-clamp-1">
                            {JSON.stringify(log.metadata)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 sm:self-center">
                      <Clock3 className="h-3 w-3 text-cyan-400/70" />
                      <span>{formatTime(log.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                No audit entries recorded yet for this workspace.
              </div>
            )
          ) : (
            /* TAB 2: API & ERROR LOGS */
            apiLogs.length > 0 ? (
              <div className="space-y-2.5">
                {apiLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isServerError = log.status >= 500;
                  const isClientError = log.status >= 400 && log.status < 500;
                  const hasError = log.hasError || log.status >= 400;

                  const statusColor = isServerError
                    ? "bg-rose-500/25 text-rose-300 border-rose-500/40 shadow-xs"
                    : isClientError
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";

                  const serviceColor =
                    log.service === "openai"
                      ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                      : log.service === "groq"
                      ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                      : log.service === "zernio"
                      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                      : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";

                  return (
                    <div
                      key={log.id}
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        hasError
                          ? isServerError
                            ? "border-rose-500/35 bg-rose-500/5 hover:bg-rose-500/10"
                            : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                          : "border-white/[0.06] bg-card/50 hover:bg-card/80"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Status Code Badge */}
                          <span
                            className={`flex h-7 px-2 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono border ${statusColor}`}
                          >
                            {log.status}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Service tag */}
                              <span
                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${serviceColor}`}
                              >
                                {log.service}
                              </span>

                              {/* Method */}
                              <span className="text-[10px] font-bold uppercase px-1 py-0.5 rounded bg-secondary/80 text-muted-foreground font-mono">
                                {log.method || "POST"}
                              </span>

                              {/* Endpoint */}
                              <span className="text-xs font-semibold text-foreground font-mono truncate max-w-sm sm:max-w-md">
                                {log.endpoint}
                              </span>

                              {/* Workspace Name */}
                              {log.businessName && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                  {log.businessName}
                                </span>
                              )}
                            </div>

                            {/* Error Preview Banner */}
                            {log.errorMessage ? (
                              <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-200">
                                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  <span>Failed (Status {log.status}):</span>
                                </div>
                                <p className="mt-0.5 font-mono text-[11px] text-rose-200/90 whitespace-pre-wrap break-all pl-5">
                                  {log.errorMessage}
                                </p>
                              </div>
                            ) : log.metadata && Object.keys(log.metadata).length > 0 && !isExpanded ? (
                              <p className="text-[11px] text-muted-foreground mt-1 font-mono line-clamp-1">
                                {JSON.stringify(log.metadata)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Latency & Timestamp */}
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0 sm:self-center">
                          <span
                            className={`font-mono font-semibold ${
                              log.durationMs > 2000
                                ? "text-amber-300"
                                : log.durationMs > 5000
                                ? "text-rose-300"
                                : "text-cyan-300/90"
                            }`}
                          >
                            {log.durationMs}ms
                          </span>
                          <span className="text-white/20">•</span>
                          <span>{formatTime(log.createdAt)}</span>
                          <span className="text-muted-foreground/60">
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <div
                          className="mt-3 pt-3 border-t border-white/[0.08] space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground/80 flex items-center gap-1">
                              Payload & Request Parameters
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const payload = {
                                  id: log.id,
                                  service: log.service,
                                  endpoint: log.endpoint,
                                  method: log.method,
                                  status: log.status,
                                  durationMs: log.durationMs,
                                  hasError: log.hasError,
                                  errorMessage: log.errorMessage,
                                  metadata: log.metadata,
                                  createdAt: log.createdAt,
                                };
                                navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                                toast.success("Log details copied to clipboard");
                              }}
                              className="text-primary hover:underline flex items-center gap-1 text-[11px] font-medium"
                            >
                              <Copy className="h-3 w-3" /> Copy JSON
                            </button>
                          </div>
                          <pre className="p-2.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-cyan-200 overflow-x-auto max-h-48 whitespace-pre-wrap">
                            {JSON.stringify(
                              {
                                endpoint: log.endpoint,
                                method: log.method,
                                status: log.status,
                                durationMs: `${log.durationMs}ms`,
                                error: log.errorMessage ?? null,
                                metadata: log.metadata || {},
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Server className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                {onlyErrors ? "No error logs recorded." : "No API calls recorded yet."}
              </div>
            )
          )}
        </div>

        {/* Footer info notice */}
        <div className="border-t border-white/[0.08] pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-cyan-400" />
            Audit trail & system API telemetry active
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

