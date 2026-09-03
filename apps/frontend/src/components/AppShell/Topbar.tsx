import { Library, LogOut } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Badge } from "../ui/Badge";
import { Button, buttonClassName } from "../ui/Button";
import { cn } from "../ui/cn";

const NAV_LINK_BASE =
  "rounded px-2.5 py-1.5 text-sm font-medium transition-colors";
const NAV_LINK_INACTIVE = "text-ink-mid hover:bg-paper-mid hover:text-ink";
const NAV_LINK_ACTIVE = "bg-ink text-paper";

export function Topbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const canManage = user?.role === "LIBRARIAN" || user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-30 border-b border-paper-edge bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          to={isAuthenticated ? "/" : "/books"}
          className="flex items-center gap-2 font-bold tracking-tight text-ink"
          aria-label="Ir al inicio"
        >
          <Library size={20} strokeWidth={2.25} />
          <span className="text-base">Sistema de biblioteca</span>
        </Link>

        <nav aria-label="Navegación principal" className="ml-4 flex items-center gap-1">
          <NavLink
            to="/books"
            className={({ isActive }) =>
              cn(NAV_LINK_BASE, isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)
            }
          >
            Libros
          </NavLink>
          {canManage ? (
            <NavLink
              to="/overdue"
              className={({ isActive }) =>
                cn(NAV_LINK_BASE, isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)
              }
            >
              Vencidos
            </NavLink>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Badge tone="outline" className="hidden sm:inline-flex">
                {user.role}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                iconLeft={<LogOut size={14} />}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClassName({ variant: "ghost", size: "sm" })}>
                Ingresar
              </Link>
              <Link
                to="/register"
                className={buttonClassName({ variant: "primary", size: "sm" })}
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
