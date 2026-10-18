import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";
import { signIn, useSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/landing")({
  component: LandingRoute,
  head: () => ({
    meta: [
      { title: "PostPilot — AI Social Studio & Instagram Auto-Publisher" },
      {
        name: "description",
        content:
          "Turn your weekly business offers into attractive Instagram posts, captions, and stories in 60 seconds with Groq AI, Ideogram, and official Meta Graph API.",
      },
    ],
  }),
});

function LandingRoute() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate Google sign-in.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <LandingPage
      onSignIn={handleGoogleSignIn}
      googleLoading={googleLoading}
      isAuthenticated={isAuthenticated}
      onGoToWorkspace={() => navigate({ to: "/" })}
    />
  );
}
