import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineMessage {
  id: string;
  content: string;
  timestamp: number;
  conversationId: string;
  attachments?: string[];
}

interface OfflineDB extends DBSchema {
  messages: {
    key: string;
    value: OfflineMessage;
    indexes: { 'by-timestamp': number };
  };
}

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingMessages, setPendingMessages] = useState<OfflineMessage[]>([]);
  const [db, setDb] = useState<IDBPDatabase<OfflineDB> | null>(null);

  // Inicializar IndexedDB
  useEffect(() => {
    const initDB = async () => {
      const database = await openDB<OfflineDB>('offline-queue', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('messages')) {
            const store = db.createObjectStore('messages', { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp');
          }
        },
      });
      setDb(database);

      // Carregar mensagens pendentes
      const messages = await database.getAll('messages');
      setPendingMessages(messages);
    };

    initDB();
  }, []);

  // Monitorar status de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Conexão restabelecida');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Sem conexão');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Adicionar mensagem à fila offline
  const queueMessage = useCallback(async (message: Omit<OfflineMessage, 'id' | 'timestamp'>) => {
    if (!db) return null;

    const offlineMessage: OfflineMessage = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...message,
    };

    await db.add('messages', offlineMessage);
    setPendingMessages(prev => [...prev, offlineMessage]);
    
    return offlineMessage;
  }, [db]);

  // Remover mensagem da fila
  const removeMessage = useCallback(async (messageId: string) => {
    if (!db) return;

    await db.delete('messages', messageId);
    setPendingMessages(prev => prev.filter(m => m.id !== messageId));
  }, [db]);

  // Limpar todas as mensagens
  const clearQueue = useCallback(async () => {
    if (!db) return;

    await db.clear('messages');
    setPendingMessages([]);
  }, [db]);

  // Processar fila quando voltar online
  const processQueue = useCallback(async (
    processFn: (message: OfflineMessage) => Promise<void>
  ) => {
    if (!isOnline || pendingMessages.length === 0) return;

    console.log(`📤 Processando ${pendingMessages.length} mensagens pendentes...`);

    for (const message of pendingMessages) {
      try {
        await processFn(message);
        await removeMessage(message.id);
        console.log(`✅ Mensagem ${message.id} sincronizada`);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar mensagem ${message.id}:`, error);
        // Não remove da fila se falhar - tentará novamente depois
      }
    }
  }, [isOnline, pendingMessages, removeMessage]);

  return {
    isOnline,
    pendingMessages,
    queueMessage,
    removeMessage,
    clearQueue,
    processQueue,
  };
};
