import { AppNav } from '../components/app-nav'
import { Ajustes } from './ajustes'

export default function AjustesPage() { return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/planos">Ver planos</a></header><AppNav active="/ajustes" /><Ajustes /></section></main> }
