import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav>
      <Link to="/">Home</Link> <Link to="/form">Form</Link>{' '}
      {user ? (
        <button onClick={logout}>Log out ({user.email})</button>
      ) : (
        <Link to="/login">Log in</Link>
      )}
    </nav>
  )
}

export default Navbar
