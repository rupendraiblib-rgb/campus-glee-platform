import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span>Smart School ERP</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground">Home</Link>
          <Link to="/about" activeProps={{ className: "text-foreground" }} className="hover:text-foreground">About</Link>
          <Link to="/pricing" activeProps={{ className: "text-foreground" }} className="hover:text-foreground">Pricing</Link>
          <Link to="/contact" activeProps={{ className: "text-foreground" }} className="hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
          <Button asChild size="sm"><Link to="/signup">Get started</Link></Button>
        </div>
      </div>
    </header>
  );
}
