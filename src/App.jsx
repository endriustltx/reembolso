import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MeusLancamentosPage from './pages/MeusLancamentosPage'
import BancoHorasPage from './pages/BancoHorasPage'
import NotasFiscaisPage from './pages/NotasFiscaisPage'
import RelatorioPage from './pages/RelatorioPage'
import ColaboradoresPage from './pages/ColaboradoresPage'
import NovoLancamentoModal from './components/NovoLancamentoModal'

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--g7-navy)',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="8" fill="#F56E0F"/>
        <path d="M7 14L12 9L17 14L22 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 19L12 14L17 19L22 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Carregando...</div>
    </div>
  )
}

export default function App() {
  const { user, profile, loading, isAdm } = useAuth()
  const [page, setPage] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  if (loading) return <LoadingScreen />
  if (!user || !profile) return <LoginPage />

  // Página padrão por role
  const currentPage = page || (isAdm ? 'dashboard' : 'meus-lancamentos')

  function navigate(p) {
    if (p === 'novo-lancamento') { setModalOpen(true); return }
    setPage(p)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar currentPage={currentPage} onNavigate={navigate} />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {/* ADM Pages */}
        {isAdm && currentPage === 'dashboard' && (
          <DashboardPage onNavigate={navigate} />
        )}
        {isAdm && currentPage === 'todos-lancamentos' && (
          <MeusLancamentosPage isAdm={true} />
        )}
        {isAdm && currentPage === 'relatorio' && (
          <RelatorioPage />
        )}
        {isAdm && currentPage === 'colaboradores' && (
          <ColaboradoresPage />
        )}

        {/* Shared Pages */}
        {currentPage === 'banco-horas' && <BancoHorasPage />}
        {currentPage === 'notas-fiscais' && <NotasFiscaisPage />}

        {/* Técnico Pages */}
        {!isAdm && currentPage === 'meus-lancamentos' && (
          <MeusLancamentosPage isAdm={false} />
        )}
      </main>

      {/* Modal novo lançamento (para técnicos via sidebar) */}
      <NovoLancamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setModalOpen(false)}
      />
    </div>
  )
}
