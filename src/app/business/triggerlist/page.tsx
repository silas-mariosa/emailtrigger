'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

interface EmailLog {
  email: string;
  dataEnvio: string;
  situacao: string;
}

const ITEMS_PER_PAGE = 50;

export default function Dashboard() {
  const [emailStatus, setEmailStatus] = useState<EmailLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();

  const fetchEmailStatus = async () => {
    try {
      const response = await axios.get('/api/get-email-status');
      setEmailStatus(response.data); // Assuming response.data is EmailLog[]
      setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar o status dos e-mails.',
        description: 'Houve um problema ao carregar os dados. Tente novamente.',
        action: <ToastAction altText="Tentar novamente" onClick={fetchEmailStatus}>Tentar novamente</ToastAction>,
      });
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmailStatus(); // Fetch initial status

    const intervalId = setInterval(fetchEmailStatus, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Clear interval on component unmount
  }, []);

  const handleEmailSending = async (action: 'start' | 'pause' | 'resume') => {
    setIsSending(action === 'start');
    try {
      const endpoint = action === 'start' ? '/api/send-emails' : action === 'pause' ? '/api/pause-emails' : '/api/resume-emails';
      await axios.post(endpoint);
      toast({
        variant: 'default',
        title: `Envio de e-mails ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'retomado'}!`,
        description: `O envio de e-mails foi ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'retomado'} com sucesso.`,
      });
      setIsPaused(action === 'pause');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: `Erro ao ${action === 'start' ? 'iniciar' : action === 'pause' ? 'pausar' : 'retomar'} o envio de e-mails.`,
        description: 'Houve um problema ao processar a ação. Tente novamente.',
        action: <ToastAction altText="Tentar novamente" onClick={() => handleEmailSending(action)}>Tentar novamente</ToastAction>,
      });
      console.log(err);
    } finally {
      if (action !== 'start') setIsSending(false); // Reset state after pause/resume
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const currentLogs = emailStatus.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-semibold mb-4">Dashboard de Envio de E-mails</h1>
      <button onClick={() => handleEmailSending('start')} disabled={isSending || isPaused} className={`px-4 py-2 text-white rounded-md ${isSending || isPaused ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
        {isSending ? (isPaused ? 'Retomar envio de e-mails...' : 'Enviando e-mails...') : 'Iniciar envio de e-mails'}
      </button>
      <button onClick={() => handleEmailSending('pause')} disabled={!isSending} className="ml-4 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">Pausar envio de e-mails</button>
      <button onClick={() => handleEmailSending('resume')} disabled={!isSending} className="ml-4 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Retomar envio de e-mails</button>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Status dos E-mails Enviados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left border-b border-gray-300">Email</th>
                <th className="px-4 py-2 text-left border-b border-gray-300">Data de Envio</th>
                <th className="px-4 py-2 text-left border-b border-gray-300">Situação</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log, index) => (
                <tr key={index} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 border-b border-gray-300">{log.email}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{new Date(log.dataEnvio).toLocaleString()}</td>
                  <td className="px-4 py-2 border-b border-gray-300">{log.situacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Anterior</button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Próxima</button>
        </div>
      </div>     
    </div>
  );
}
