import Header from "@/components/Header";
import MessageThread from "@/components/MessageThread";
import SiteFooter from "@/components/SiteFooter";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main
      className="min-h-screen bg-cover bg-fixed bg-center text-slate-950"
      style={{ backgroundImage: "url('/bee-background.png')" }}
    >
      <div className="min-h-screen bg-white/70">
        <Header />

        <div className="px-3 py-4 md:px-5">
          <MessageThread conversationId={id} />
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
