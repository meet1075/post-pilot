import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { connectAccount } from "@/api/accounts";
import { Check, LoaderCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/zernio-callback")({
  component: ZernioCallbackPage,
});

function ZernioCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");
  const [accountHandle, setAccountHandle] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const connectedParam = params.get("connected") || params.get("platform");
    const platform = connectedParam
      ? connectedParam.charAt(0).toUpperCase() + connectedParam.slice(1).toLowerCase()
      : "Instagram";
    const state = params.get("state") || undefined;
    const accountId = params.get("accountId") || params.get("account_id");
    const handle = params.get("username") || params.get("handle") || "connected";
    const error = params.get("error") || params.get("error_description");

    if (error) {
      setStatus("error");
      setErrorMessage(error);
      return;
    }

    if (!accountId) {
      // If returned without accountId or in manual return
      setStatus("error");
      setErrorMessage("No account ID returned from OAuth provider. Please ensure you approved all required permissions for your Instagram Business/Creator account.");
      return;
    }

    setAccountHandle(handle);

    // Save connected account to DB with signed state
    connectAccount({
      data: {
        platform,
        platform_handle: handle.replace(/^@/, ""),
        zernio_account_id: accountId,
        state,
      },
    })
      .then((res: any) => {
        if (res && (res.status === "success" || res.success)) {
          setStatus("success");
          toast.success(`${platform} connected successfully!`);
          setTimeout(() => {
            navigate({ to: "/" });
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage(res?.message || "Failed to register connected account");
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
        {status === "processing" && (
          <div className="space-y-4">
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="font-display text-2xl font-semibold">Completing OAuth Connection</h1>
            <p className="text-sm text-muted-foreground">
              Linking your Instagram Professional account with PostPilot...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-olive/10 text-olive">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Account Connected!</h1>
            <p className="text-sm text-muted-foreground">
              Your Instagram Professional account <span className="font-semibold text-foreground">@{accountHandle}</span> has been verified and connected.
            </p>
            <p className="text-xs text-muted-foreground">Redirecting to workspace in a moment...</p>
            <Button className="mt-4 w-full gap-2" onClick={() => navigate({ to: "/" })}>
              Open Workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-semibold">Connection Incomplete</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <div className="rounded-lg bg-secondary/70 p-3 text-left text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Requirement Reminder:</p>
              <p className="mt-1">
                Your Instagram account must be a <strong>Business or Creator</strong> account and linked to a Facebook Page. Personal accounts do not support API publishing.
              </p>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
              Back to PostPilot
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
