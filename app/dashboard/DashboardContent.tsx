'use client';

import Link from 'next/link';
import { usePlan } from '@/context/PlanContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';

interface DashboardContentProps {
  userName: string;
}

export default function DashboardContent({ userName }: DashboardContentProps) {
  const { plan } = usePlan();

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Account portal</p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Welcome, {userName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your ProducerApps account, billing, and profile here. Build and
          run your MixFlip experience in the dedicated app.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="sm:w-auto w-full"
            variant="default"
          >
            <Link
              href="https://mixflip.producerapps.com"
              target="_blank"
              rel="noreferrer"
            >
              Open MixFlip app
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="sm:w-auto w-full">
            <Link href="/dashboard/account">
              Manage billing & profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Current plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-semibold capitalize">{plan}</div>
            <CardDescription>
              Update your subscription, payment method, or invoices in the
              account settings.
            </CardDescription>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/dashboard/account">
                Go to billing
                <ArrowRight className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Where to build</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-lg font-semibold">
              MixFlip lives at mixflip.producerapps.com
            </div>
            <CardDescription>
              Players, songs, landing pages, and analytics are all in the MixFlip
              app. Use this account portal for auth, billing, and profile
              changes.
            </CardDescription>
            <div className="flex gap-2">
              <Button asChild size="sm" className="w-full">
                <Link
                  href="https://mixflip.producerapps.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open MixFlip
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>
            Common account tasks are one click away.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <ActionLink
            href="/dashboard/account"
            title="Billing & invoices"
            description="Update payment method or download invoices."
          />
          <ActionLink
            href="/dashboard/account"
            title="Profile details"
            description="Edit name, email, or password."
          />
          <ActionLink
            href="https://mixflip.producerapps.com"
            title="Open MixFlip app"
            description="Create players, songs, and landing pages."
            external
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ActionLink({
  href,
  title,
  description,
  external
}: {
  href: string;
  title: string;
  description: string;
  external?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4 hover:border-primary transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{title}</div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="px-0 mt-2"
        asChild
      >
        <Link
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
        >
          {external ? 'Open app' : 'Open'}
          <ArrowRight className="h-3 w-3 ml-2" />
        </Link>
      </Button>
    </div>
  );
}
