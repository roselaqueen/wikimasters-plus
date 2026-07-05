import { useState } from 'react'
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '../auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setPassword('')
    setLoading(false)
    if (error)
      setError(
        error.message === 'Invalid login credentials'
          ? 'Adresse ou mot de passe incorrect.'
          : error.message,
      )
  }
  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand">
          <span>W</span>
          <h1>
            WikiMasters<em>+</em>
          </h1>
        </div>
        <h2>Retrouvez votre collection.</h2>
        <p>Connectez-vous avec votre compte WikiMasters existant.</p>
        <form onSubmit={submit}>
          <label>
            Adresse courriel
            <div>
              <Mail size={18} />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>
          <label>
            Mot de passe
            <div>
              <LockKeyhole size={18} />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Connexion'}
          </button>
        </form>
        <footer>
          <ShieldCheck size={16} />
          <span>
            Votre mot de passe est envoyé directement à Supabase et n’est jamais
            enregistré par WikiMasters+.
          </span>
        </footer>
      </section>
    </main>
  )
}
