import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ReviewSystem } from "@/components/ReviewSystem";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { EnhancedVerificationSystem } from "@/components/EnhancedVerificationSystem";

export default function ProfessionalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Dashboard do Profissional</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus serviços e avaliações</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <PushNotificationManager />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="verification">Verificação</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Dashboard userType="professional" />
          </TabsContent>

          <TabsContent value="verification">
            <EnhancedVerificationSystem 
              userId={user.id}
              showRestrictions={false}
              showUploadForm={true}
              compact={false}
              enforceRestrictions={false}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewSystem 
              professionalId={user.id}
              canReview={false}
              showReviews={true}
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Notificações</h3>
                  <PushNotificationManager />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}