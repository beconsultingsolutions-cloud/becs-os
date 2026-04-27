import { PortalPageShell } from "@/lib/client-layout";
import { Construction } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PortalPlaceholderPage({ title }: { title: string }) {
  return (
    <PortalPageShell>
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="mx-auto w-14 h-14 rounded-full bg-[hsl(83,60%,57%)]/15 flex items-center justify-center">
          <Construction size={26} className="text-[hsl(83,60%,45%)]" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-slate-600">
          This area is coming in the next release. For now, reach out directly and we'll make sure
          you get what you need.
        </p>
        <Link href="/portal">
          <a className="inline-block mt-6">
            <Button className="bg-[hsl(232,45%,18%)] hover:bg-[hsl(232,45%,12%)] text-white">
              Back to dashboard
            </Button>
          </a>
        </Link>
      </div>
    </PortalPageShell>
  );
}
