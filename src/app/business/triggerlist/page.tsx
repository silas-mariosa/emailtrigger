'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Mail, AlertCircle, CheckCircle, Trash2, MapPin } from 'lucide-react';

interface EmailLog {
  email: string;
  dataEnvio: string;
  situacao: string;
}

interface EmailStatus {
  isPaused: boolean;
  isSending: boolean;
  totalSent: number;
  totalErrors: number;
  totalPaused: number;
  statusDetalhado?: string;
  ultimoEnvioInfo?: {
    timestamp: string;
    dataFormatada: string;
    email: string;
  };
  proximoEnvio?: string;
  tempoRestante?: number;
  tempoDesdeUltimoEnvio?: number;
  pauseReason?: string | null;
  pausedAt?: string | null;
  lastUpdated: string;
}

interface EmailStats {
  totalUnicos: number;
  jaEnviados: number;
  restantes: number;
  estadoFiltro?: string | null;
  percentualConcluido?: number;
}

interface HostingerLimits {
  dailyLimit: number;
  batchDelay: number;
  maxRecipients: number;
  maxEmailSize: number;
  maxAttachmentSize: number;
}

interface Estado {
  estados: string[];
  totalEstados: number;
}

const ITEMS_PER_PAGE = 20;

export default function Dashboard() {
  const [emailStatus, setEmailStatus] = useState<EmailLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<EmailStatus | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [estados, setEstados] = useState<Estado | null>(null);
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('todos');
  const { toast } = useToast();

  const fetchEmailStatus = async () => {
    try {
      const response = await axios.get('/api/get-email-status');
      setEmailStatus(response.data);
      setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Erro ao carregar status dos e-mails:', err);
    }
  };

  const fetchSendingStatus = async () => {
    try {
      const response = await axios.get('/api/get-email-sending-status');
      const status = response.data;
      setSendingStatus(status);
      setIsSending(status.isSending);
      setIsPaused(status.isPaused);
    } catch (err) {
      console.error('Erro ao carregar status do envio:', err);
    }
  };

  const fetchEstados = async () => {
    try {
      const response = await axios.get('/api/get-estados');
      setEstados(response.data);
    } catch (err) {
      console.error('Erro ao carregar estados:', err);
    }
  };

  const fetchEmailStats = async () => {
    try {
      const url = estadoSelecionado && estadoSelecionado !== 'todos'
        ? `/api/get-email-stats?estado=${encodeURIComponent(estadoSelecionado)}`
        : '/api/get-email-stats';
      const response = await axios.get(url);
      setEmailStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas de emails:', err);
    }
  };

  useEffect(() => {
    fetchEmailStatus();
    fetchSendingStatus();
    fetchEstados();
    fetchEmailStats();

    const intervalId = setInterval(() => {
      fetchEmailStatus();
      fetchSendingStatus();
      fetchEmailStats();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [estadoSelecionado]);

  // Effect para gerenciar countdown
  useEffect(() => {
    if (sendingStatus?.tempoRestante && sendingStatus.tempoRestante > 0) {
      setCountdown(Math.ceil(sendingStatus.tempoRestante / 1000));

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          }
          return null;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    } else {
      setCountdown(null);
    }
  }, [sendingStatus?.tempoRestante]);

  const handleEmailSending = async (action: 'start' | 'pause' | 'resume') => {
    setIsLoading(true);
    try {
      const endpoint = action === 'start' ? '/api/send-emails' : action === 'pause' ? '/api/pause-emails' : '/api/resume-emails';

      let response;
      if (action === 'start') {
        const data = estadoSelecionado && estadoSelecionado !== 'todos' ? { estado: estadoSelecionado } : {};
        response = await axios.post(endpoint, data);
      } else {
        response = await axios.post(endpoint);
      }

      // Atualizar status imediatamente
      if (action === 'start') {
        setIsSending(true);
        setIsPaused(false);
      } else if (action === 'pause') {
        setIsSending(false);
        setIsPaused(true);
      } else if (action === 'resume') {
        setIsSending(true);
        setIsPaused(false);
      }

      // Atualizar dados
      await fetchSendingStatus();
      await fetchEmailStatus();

      // Mensagem personalizada baseada na resposta da API
      let description = response.data.message || `O envio de e-mails foi ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'retomado'} com sucesso.`;

      if (action === 'start' && response.data.status === 'cooldown') {
        description = `⏰ ${response.data.message}`;
      } else if (action === 'resume' && response.data.status === 'resumed_no_emails') {
        description = `Envio retomado! Todos os ${response.data.totalUnicos} emails únicos já foram enviados.`;
      } else if (action === 'resume' && response.data.emailsRestantes) {
        description = `Envio retomado! Restam ${response.data.emailsRestantes} emails únicos para enviar (${response.data.jaEnviados} já enviados).`;
      }

      toast({
        variant: 'default',
        title: `Envio de e-mails ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'retomado'}!`,
        description: description,
      });
    } catch (err: any) {
      console.error(`Erro ao ${action} envio:`, err);

      toast({
        variant: 'destructive',
        title: `Erro ao ${action === 'start' ? 'iniciar' : action === 'pause' ? 'pausar' : 'retomar'} o envio de e-mails.`,
        description: err.response?.data?.error || 'Houve um problema ao processar a ação. Tente novamente.',
        action: <ToastAction altText="Tentar novamente" onClick={() => handleEmailSending(action)}>Tentar novamente</ToastAction>,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCleanDuplicates = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/clean-duplicate-emails');

      // Atualizar dados após limpeza
      await fetchEmailStatus();

      toast({
        variant: 'default',
        title: 'Emails duplicados removidos!',
        description: `${response.data.duplicatasRemovidas} entradas duplicadas foram removidas. Total de emails únicos: ${response.data.totalUnicos}`,
      });
    } catch (err: any) {
      console.error('Erro ao limpar emails duplicados:', err);

      toast({
        variant: 'destructive',
        title: 'Erro ao limpar emails duplicados',
        description: err.response?.data?.error || 'Houve um problema ao limpar os emails duplicados. Tente novamente.',
        action: <ToastAction altText="Tentar novamente" onClick={handleCleanDuplicates}>Tentar novamente</ToastAction>,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLogs = emailStatus.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string; icon: string } } = {
      'enviando': { text: 'Enviando emails...', color: 'text-blue-600', icon: '📤' },
      'aguardando_cooldown': { text: 'Aguardando cooldown', color: 'text-orange-600', icon: '⏰' },
      'pronto_para_enviar': { text: 'Pronto para enviar', color: 'text-green-600', icon: '✅' },
      'pausado': { text: 'Sistema pausado', color: 'text-gray-600', icon: '⏸️' },
      'nenhum_envio': { text: 'Nenhum envio realizado', color: 'text-gray-500', icon: '📭' },
      'sem_log': { text: 'Sem histórico de envios', color: 'text-gray-500', icon: '📋' },
      'erro_calculo': { text: 'Erro no cálculo', color: 'text-red-600', icon: '⚠️' },
      'parado': { text: 'Sistema parado', color: 'text-gray-600', icon: '⏹️' }
    };

    return statusMap[status] || { text: 'Status desconhecido', color: 'text-gray-500', icon: '❓' };
  };

  const getStatusBadge = (situacao: string) => {
    if (situacao === "Enviado com sucesso") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
    } else if (situacao.includes("Erro")) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
    } else if (situacao === "Envio pausado") {
      return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Pausado</Badge>;
    } else {
      return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard de Envio de E-mails</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => handleEmailSending('start')}
            disabled={isSending || isPaused || isLoading || (countdown !== null && countdown > 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {isLoading ? 'Processando...' : countdown !== null && countdown > 0 ? `Aguardar (${formatTime(countdown)})` : 'Iniciar Envio'}
          </Button>

          <Button
            onClick={() => handleEmailSending('pause')}
            disabled={!isSending || isPaused || isLoading}
            variant="destructive"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pausar
          </Button>

          <Button
            onClick={() => handleEmailSending('resume')}
            disabled={!isPaused || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retomar
          </Button>

          <Button
            onClick={handleCleanDuplicates}
            disabled={isLoading}
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Duplicatas
          </Button>
        </div>
      </div>

      {/* Seletor de Estado */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filtrar por Estado:</span>
          </div>

          <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Estados</SelectItem>
              {estados?.estados.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {estadoSelecionado && estadoSelecionado !== 'todos' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Estado: {estadoSelecionado}
            </Badge>
          )}
        </div>

        {estados && (
          <div className="mt-2 text-sm text-gray-600">
            Total de estados disponíveis: {estados.totalEstados}
            {estadoSelecionado && estadoSelecionado !== 'todos' && emailStats && (
              <span className="ml-4">
                • Candidatos no estado {estadoSelecionado}: {emailStats.totalUnicos}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cards de Status */}
      {sendingStatus && (
        <div className={`grid grid-cols-1 md:grid-cols-${sendingStatus?.pauseReason ? '9' : '8'} gap-4 mb-6`}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Detalhado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                {sendingStatus?.statusDetalhado && (
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {getStatusText(sendingStatus.statusDetalhado).icon}
                    </span>
                    <span className={`text-sm font-medium ${getStatusText(sendingStatus.statusDetalhado).color}`}>
                      {getStatusText(sendingStatus.statusDetalhado).text}
                    </span>
                  </div>
                )}

                {sendingStatus?.ultimoEnvioInfo && (
                  <div className="text-xs text-muted-foreground">
                    <div>Último envio: {sendingStatus.ultimoEnvioInfo.dataFormatada}</div>
                    <div className="truncate">Email: {sendingStatus.ultimoEnvioInfo.email}</div>
                  </div>
                )}

                {sendingStatus?.tempoDesdeUltimoEnvio && (
                  <div className="text-xs text-muted-foreground">
                    Há {Math.floor(sendingStatus.tempoDesdeUltimoEnvio / 1000 / 60)} min atrás
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-green-500" />
                <span className="text-2xl font-bold">{sendingStatus.totalSent}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Erros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                <span className="text-2xl font-bold">{sendingStatus.totalErrors}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pausados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Pause className="w-4 h-4 mr-2 text-orange-500" />
                <span className="text-2xl font-bold">{sendingStatus.totalPaused}</span>
              </div>
            </CardContent>
          </Card>

          {emailStats && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Progresso{estadoSelecionado && estadoSelecionado !== 'todos' ? ` - ${estadoSelecionado}` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Restantes</span>
                    <span className="text-lg font-bold text-blue-600">{emailStats.restantes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Únicos</span>
                    <span className="text-sm font-medium">{emailStats.totalUnicos}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${emailStats.percentualConcluido}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-center mt-1 text-muted-foreground">
                    {emailStats.percentualConcluido}% concluído
                    {estadoSelecionado && estadoSelecionado !== 'todos' && (
                      <span className="block text-blue-600 font-medium">
                        Estado: {estadoSelecionado}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card de Cooldown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximo Envio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {countdown !== null && countdown > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {formatTime(countdown)}
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      Aguardando cooldown
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.max(0, ((countdown || 0) / 60) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      Pronto
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      Pode enviar
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de Diagnóstico */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pausado:</span>
                  <span className={isPaused ? "text-red-600" : "text-green-600"}>
                    {isPaused ? "Sim" : "Não"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enviando:</span>
                  <span className={isSending ? "text-blue-600" : "text-gray-600"}>
                    {isSending ? "Sim" : "Não"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cooldown:</span>
                  <span className={countdown !== null && countdown > 0 ? "text-orange-600" : "text-green-600"}>
                    {countdown !== null && countdown > 0 ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última atualização:</span>
                  <span className="text-gray-600">
                    {sendingStatus?.lastUpdated ? new Date(sendingStatus.lastUpdated).toLocaleTimeString('pt-BR') : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Pausa Automática */}
          {sendingStatus?.pauseReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700">
                  🚨 Pausa Automática
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2 text-xs">
                  <div className="text-red-700 font-medium">
                    {sendingStatus.pauseReason}
                  </div>
                  {sendingStatus.pausedAt && (
                    <div className="text-red-600">
                      Pausado em: {new Date(sendingStatus.pausedAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                  <div className="text-red-600 text-xs">
                    Sistema pausado automaticamente para proteger a integridade do domínio
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card de Limites da Hostinger */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📧 Limites Hostinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limite diário:</span>
                  <span className="text-blue-600 font-medium">3.000 emails</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinatários/email:</span>
                  <span className="text-blue-600 font-medium">100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamanho email:</span>
                  <span className="text-blue-600 font-medium">35 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamanho anexo:</span>
                  <span className="text-blue-600 font-medium">25 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cooldown:</span>
                  <span className="text-orange-600 font-medium">5 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos E-mails Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">Data de Envio</th>
                  <th className="text-left p-2 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-sm">{log.email}</td>
                    <td className="p-2 text-sm">
                      {new Date(log.dataEnvio).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2">
                      {getStatusBadge(log.situacao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
