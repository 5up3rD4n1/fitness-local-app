import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

type Mode = 'login' | 'register';

const LoginScreen: React.FC = () => {
  const { login, register, listUsers } = useApp();
  const users = listUsers();

  const [mode, setMode] = useState<Mode>(users.length > 0 ? 'login' : 'register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const ok = await login(username, password);
        if (!ok) setError('Usuario o contraseña incorrectos.');
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPassword('');
  };

  const pickUser = (name: string) => {
    setMode('login');
    setUsername(name);
    setPassword('');
    setError(null);
  };

  const inputCls =
    'w-full rounded-[12px] border border-border-primary bg-surface-raised px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-text-tertiary focus:border-accent';

  return (
    <div className="app-aurora flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-white">
            Entrenamiento
          </h1>
          <p className="mt-1 text-caption text-text-secondary">
            {mode === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta local'}
          </p>
        </div>

        {/* Existing users (quick pick) */}
        {mode === 'login' && users.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 px-1 text-micro uppercase tracking-[0.14em] text-text-tertiary">
              Cuentas en este dispositivo
            </p>
            <div className="list">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => pickUser(u.username)}
                  className={`list-row w-full text-left ${
                    username === u.username ? 'bg-surface-raised' : ''
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-primary bg-surface-raised text-text-secondary">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.7}
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="flex-1 font-display text-[15px] font-medium text-white">
                    {u.username}
                  </span>
                  {username === u.username && (
                    <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-3">
          <input
            className={inputCls}
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className={inputCls}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="px-1 text-caption text-danger">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {/* Mode toggle */}
        <div className="mt-5 text-center text-caption text-text-secondary">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-display font-semibold text-accent"
              >
                Crear una
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-display font-semibold text-accent"
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-micro leading-relaxed text-text-tertiary">
          Las cuentas se guardan solo en este dispositivo. No es un sistema de seguridad real.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
