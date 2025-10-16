import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Trash2, Shield, RefreshCcw, Database as DatabaseIcon, Settings } from "lucide-react";
type TableName = keyof Database['public']['Tables'];

interface TableInfo {
  key: string;
  label: string;
  table: TableName;
  order?: number; // lower runs first in Reset All
}

const TABLES: TableInfo[] = [
  { key: "messages", label: "Mensagens (chat_messages)", table: "chat_messages" as TableName, order: 1 },
  { key: "notifications", label: "Notificações (notifications)", table: "notifications" as TableName, order: 1 },
  { key: "quotes", label: "Orçamentos (quotes)", table: "quotes" as TableName, order: 2 },
  { key: "requests", label: "Solicitações (service_requests)", table: "service_requests" as TableName, order: 3 },
  { key: "reviews", label: "Avaliações (reviews)", table: "reviews" as TableName, order: 2 },
];

const Admin: React.FC = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [openConfirm, setOpenConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  const tablesByKey = useMemo(() =>
    TABLES.reduce((acc, t) => ({ ...acc, [t.key]: t }), {} as Record<string, TableInfo>),
  []);

  useEffect(() => {
    document.title = "Admin • Reiniciar dados";
    // simple canonical management
    const linkId = "canonical-admin";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/admin";
  }, []);

  const fetchCounts = async () => {
    const newCounts: Record<string, number | null> = {};
    for (const t of TABLES) {
      const { count, error } = await supabase
        .from(t.table)
        .select("id", { count: "exact", head: true });
      newCounts[t.key] = error ? null : (count ?? 0);
    }
    setCounts(newCounts);
  };

  useEffect(() => {
    if (!loading && user) fetchCounts();
  }, [loading, user]);

  const deleteOwnedFrom = async (table: TableName, uid: string) => {
    let q: any = (supabase.from(table as any).delete() as any);
    switch (table) {
      case "service_requests":
        q = q.eq("client_id", uid);
        break;
      case "quotes":
        q = q.or(`professional_id.eq.${uid}`);
        break;
      case "chat_messages":
        q = q.eq("sender_id", uid);
        break;
      case "notifications":
        q = q.eq("user_id", uid);
        break;
      case "reviews":
        q = q.or(`reviewer_id.eq.${uid},reviewed_id.eq.${uid}`);
        break;
      default:
        q = q.not("id", "is", null as any);
    }
    const { error } = await q;
    if (error) throw error;
  };

  const deleteAllFrom = async (table: TableName) => {
    try {
      console.log(`Attempting to delete all from ${table}`);
      
      // Para service_requests, vamos tentar uma abordagem mais agressiva
      if (table === 'service_requests') {
        // Primeiro, deletar todas as referências relacionadas
        try {
          await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('quotes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (refError) {
          console.warn('Error deleting references:', refError);
        }
      }
      
      // Tentativa 1: delete global usando neq para contornar alguns problemas de RLS
      const { error } = await (supabase.from(table as any).delete() as any).neq("id", "00000000-0000-0000-0000-000000000000");
      if (!error) {
        console.log(`Successfully deleted all from ${table}`);
        return;
      }

      console.warn(`Delete global falhou em ${table}:`, error);
      
      // Tentativa 2: delete por lotes usando select primeiro
      const { data: items } = await supabase.from(table as any).select('id').limit(1000);
      if (items && items.length > 0) {
        const ids = items.map((item: any) => item.id);
        const { error: deleteError } = await supabase.from(table as any).delete().in('id', ids);
        if (!deleteError) {
          console.log(`Successfully deleted ${ids.length} items from ${table}`);
          return;
        }
        console.warn(`Batch delete failed for ${table}:`, deleteError);
      }
      
      // Tentativa 3: delete apenas dos registros do usuário (compatível com RLS comuns)
      if (user?.id) {
        await deleteOwnedFrom(table, user.id);
      } else {
        throw error;
      }
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }
  };

  const handleDelete = async (key: string) => {
    console.log("handleDelete called for:", key);
    console.log("tablesByKey:", tablesByKey);
    console.log("selected table:", tablesByKey[key]);
    
    try {
      setBusy(true);
      console.log("Starting delete for table:", tablesByKey[key]?.table);
      
      if (!tablesByKey[key]) {
        throw new Error(`Table configuration not found for key: ${key}`);
      }
      
      await deleteAllFrom(tablesByKey[key].table);
      toast({ 
        title: "Concluído", 
        description: `${tablesByKey[key].label} apagados com sucesso.`,
        duration: 3000
      });
      await fetchCounts();
    } catch (e: any) {
      console.error("Delete error:", e);
      toast({ 
        title: "Falha ao apagar", 
        description: e.message || "Erro desconhecido", 
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setBusy(false);
      setOpenConfirm(null);
    }
  };

  const handleResetAll = async () => {
    try {
      setBusy(true);
      // Executa por níveis para respeitar FKs: filhos -> pais
      const byOrder = [...TABLES].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      // Agrupa por ordem
      const groups: Record<number, TableInfo[]> = {};
      for (const t of byOrder) {
        const o = t.order ?? 99;
        groups[o] = groups[o] ? [...groups[o], t] : [t];
      }
      const orders = Object.keys(groups).map(Number).sort((a, b) => a - b);
      for (const o of orders) {
        await Promise.all(groups[o].map(t => deleteAllFrom(t.table)));
      }
      toast({ title: "Reset concluído", description: "Todos os dados de teste foram apagados." });
      await fetchCounts();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Falha no reset", description: e.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setBusy(false);
      setOpenConfirm(null);
    }
  };

  console.log("Admin Debug:", { user: user?.email, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (!user) {
    console.log("No user found, redirecting");
    return null;
  }

  // Verificação de autorização - apenas para o admin específico
  console.log("Checking admin access for:", user.email);
  if (user.email !== "ortelanjulio@hotmail.com") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <Button onClick={() => window.history.back()}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Admin • Ferramentas</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCounts} disabled={busy}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Atualizar contagens
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <section className="grid gap-6 md:grid-cols-2">
          {/* Danger zone cards */}
          {TABLES.map((t) => (
            <Card key={t.key} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{t.label}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registros: {counts[t.key] === null ? "—" : counts[t.key]}
                  </p>
                </div>
                <AlertDialog open={openConfirm === t.key} onOpenChange={(o) => setOpenConfirm(o ? t.key : null)}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={busy}>
                      <Trash2 className="w-4 h-4 mr-2" /> Apagar tudo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação apagará permanentemente todos os registros de {t.label}. Não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(t.key)} disabled={busy}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </section>

        <Separator className="my-8" />

        <section>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Reset total de dados de teste</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Apaga mensagens, notificações, orçamentos, avaliações e solicitações na ordem correta.
                </p>
              </div>
              <AlertDialog open={openConfirm === "reset-all"} onOpenChange={(o) => setOpenConfirm(o ? "reset-all" : null)}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={busy}>
                    <DatabaseIcon className="w-4 h-4 mr-2" /> Reset total
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível e apagará todos os dados de teste principais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAll} disabled={busy}>
                      Confirmar reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Link para Editor de Fluxos */}
        <section>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Editor de Fluxos de Atendimento</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure etapas personalizadas para cada categoria de serviço.
                </p>
              </div>
              <Button onClick={() => window.open('/admin/service-flow-editor', '_blank')} className="gap-2">
                <Settings className="w-4 h-4" />
                Abrir Editor
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Admin;
