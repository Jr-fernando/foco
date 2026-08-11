import { AppNav } from '../components/app-nav'
import { FocusTimer } from '../focus-timer'

export default function FocoPage() {
  return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/ajustes">Minha conta</a></header><AppNav active="/foco" /><section className="secondary-hero"><p className="eyebrow">Modo foco</p><h1>Proteja uma hora da sua atenção.</h1><p>Um bloco de cada vez. Escolha a duração, declare sua intenção e deixe o Foco cuidar do tempo.</p></section><div className="focus-page-timer"><FocusTimer expanded /></div><section className="focus-guides"><article><span>01</span><h2>Escolha</h2><p>Defina uma tarefa pequena antes de iniciar o cronômetro.</p></article><article><span>02</span><h2>Afaste</h2><p>Silencie distrações e deixe apenas o necessário aberto.</p></article><article><span>03</span><h2>Respire</h2><p>Quando terminar, faça uma pausa curta antes do próximo bloco.</p></article></section></section></main>
}
