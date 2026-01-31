import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowRight,
  Mic,
  BarChart3,
  PiggyBank,
  TrendingUp,
  Shield,
  Smartphone,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Minimalist Wealth</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Take Control of Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Finances
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track income, expenses, and savings goals with voice commands.
            Beautiful charts, multi-currency support, and a minimalist design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Powerful features to help you understand and improve your financial
            health
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Mic className="h-6 w-6" />}
            title="Voice Commands"
            description="Add transactions by simply speaking. Say 'Gasté 5000 pesos en el super' and we'll do the rest."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Visual Reports"
            description="Beautiful charts and graphs to understand your spending patterns and trends."
          />
          <FeatureCard
            icon={<PiggyBank className="h-6 w-6" />}
            title="Savings Goals"
            description="Set and track savings goals with progress visualization and contribution tracking."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Multi-Currency"
            description="Support for USD, ARS, and EUR with automatic exchange rate conversion."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Secure"
            description="Your data is encrypted and protected. We never share your financial information."
          />
          <FeatureCard
            icon={<Smartphone className="h-6 w-6" />}
            title="Mobile Ready"
            description="Access your finances from any device with our fully responsive design."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Join thousands of users who have taken control of their finances
            with Minimalist Wealth.
          </p>
          <Link href="/register">
            <Button size="lg">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="font-semibold">Minimalist Wealth</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Minimalist Wealth. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card border hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
