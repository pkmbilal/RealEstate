"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, MailCheck, RotateCw } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(search.get("email") || "");
  }, [search]);

  async function onVerify(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Account verified! Welcome 🎉");
    router.refresh();
    router.push("/dashboard");
  }

  async function onResend() {
    if (!email) return toast.error("Enter your email first.");
    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("OTP resent. Check your email.");
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="Enter the 6-digit OTP we sent to your email to activate your account."
      footer={
        <>
          Wrong email?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Go back to signup
          </Link>
        </>
      }
    >
      <form onSubmit={onVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <MailCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@email.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">OTP code</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="otp"
              placeholder="6-digit code"
              className="pl-9 tracking-widest"
              value={token}
              onChange={(e) => setToken(e.target.value.trim())}
              required
              inputMode="numeric"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={onResend}
          disabled={loading}
        >
          <RotateCw className="h-4 w-4" />
          Resend OTP
        </Button>
      </form>
    </AuthCard>
  );
}
