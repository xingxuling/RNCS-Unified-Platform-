import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth/authActions";

export function AccountMenuBadge() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Link to="/login" className="text-xs px-2 py-1 rounded-md border border-border/40">登录</Link>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <Link to="/account" className="text-muted-foreground hover:text-foreground truncate max-w-[120px]">{user.email}</Link>
      <button onClick={() => signOut()} className="text-muted-foreground">退出</button>
    </div>
  );
}
