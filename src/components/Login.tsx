import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignup) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      navigate('/form')
    } catch {
      setError(isSignup ? 'Could not create account' : 'Invalid email or password')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isSignup ? 'Sign up' : 'Log in'}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{isSignup ? 'Sign up' : 'Log in'}</button>
      {error && <p>{error}</p>}
      <p>
        {isSignup ? 'Already have an account?' : 'No account yet?'}{' '}
        <button type="button" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </form>
  )
}

export default Login
