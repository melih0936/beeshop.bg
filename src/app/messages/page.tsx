import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import MessagesOverview from "@/components/MessagesOverview";
import SiteFooter from "@/components/SiteFooter";

export default function MessagesPage() {
  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-white/70">
        <Header />

        <div className="mx-auto max-w-4xl px-3 py-4 md:px-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Съобщения</h1>
              <p className="mt-1 text-sm text-slate-600">
                Разговори по обяви в BeeShop.bg.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Обяви
            </Link>
          </div>

          <MessagesOverview />
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
