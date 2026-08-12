import Link from "next/link";
import { getSession } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import { SITE_NAME } from "@/lib/constants";
import { Avatar } from "./Avatar";

export async function Header() {
  const user = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm text-white">DX</span>
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/create"
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Create a quiz
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/me" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size={30} />
                <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 md:inline">{user.name}</span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/signin"
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
