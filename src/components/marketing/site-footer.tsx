import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background py-12">
      <div className="container mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-semibold">Smart School ERP</div>
          <p className="mt-2 text-sm text-muted-foreground">Modern school management built for the cloud era.</p>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-3">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-3">Company</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-medium mb-3">Get started</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 mt-8 pt-6 border-t border-border/60 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Smart School ERP. All rights reserved.
      </div>
    </footer>
  );
}
