"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, UserPlus } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSignup(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("OTP sent to your email. Please verify to activate your account.");
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Sign up with email and password. We'll send a 6-digit OTP to confirm."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={onSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum 6 characters (you can enforce stronger rules later).
          </p>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
