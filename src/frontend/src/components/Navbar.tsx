import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  PenSquare,
  Rss,
  Shield,
  Users,
} from "lucide-react";
import { BlogRole } from "../backend.d";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const pathname = location.pathname;

  const isAdmin =
    currentUser?.profile.blogRole === BlogRole.superadmin ||
    currentUser?.profile.blogRole === BlogRole.moderator;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          data-ocid="nav.link"
          className="flex items-center gap-2 shrink-0"
        >
          <span className="text-xl font-display text-foreground tracking-tight">
            HKLO<span className="text-primary">blogg</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            data-ocid="nav.feed.link"
            className={`nav-link px-3 py-2 rounded-md hover:bg-secondary transition-colors ${
              pathname === "/"
                ? "text-foreground font-semibold bg-secondary"
                : ""
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Flöde
            </span>
          </Link>
          {currentUser && (
            <Link
              to="/following"
              data-ocid="nav.following.link"
              className={`nav-link px-3 py-2 rounded-md hover:bg-secondary transition-colors ${
                pathname === "/following"
                  ? "text-foreground font-semibold bg-secondary"
                  : ""
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Rss className="h-4 w-4" />
                Följer
              </span>
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              data-ocid="nav.admin.link"
              className={`nav-link px-3 py-2 rounded-md hover:bg-secondary transition-colors ${
                pathname === "/admin"
                  ? "text-foreground font-semibold bg-secondary"
                  : ""
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                Admin
              </span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <Button
                asChild
                size="sm"
                className="hidden sm:flex gap-1.5"
                data-ocid="nav.create_post.button"
              >
                <Link to="/post/new">
                  <PenSquare className="h-4 w-4" />
                  Nytt inlägg
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-ocid="nav.user.button"
                    className="flex items-center gap-2 rounded-full hover:bg-secondary px-2 py-1 transition-colors"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                        {currentUser.alias.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {currentUser.alias}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile/$userId"
                      params={{ userId: currentUser.alias }}
                      data-ocid="nav.profile.link"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Min profil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" data-ocid="nav.admin.dropdown.link">
                        <Shield className="h-4 w-4 mr-2" />
                        Adminpanel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    data-ocid="nav.logout.button"
                    className="text-destructive focus:text-destructive"
                  >
                    Logga ut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-ocid="nav.login.button"
              >
                <Link to="/login">Logga in</Link>
              </Button>
              <Button size="sm" asChild data-ocid="nav.register.button">
                <Link to="/register">Registrera</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
