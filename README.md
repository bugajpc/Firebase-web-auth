# Login, Auth & Protected Routes in React

A small React + TypeScript app that shows how to build **routing**, **email/password authentication (Firebase)**, **login/logout** and **protected routes**. Read it top to bottom. Each section builds on the previous one.

> **Prefer an interactive version?** Open [`public/guide.html`](public/guide.html). It is a standalone student guide with a login/logout simulator, a quiz, a glossary and the complete source code. It is not part of the React app. Open the file directly in your browser, or while `npm run dev` is running visit `http://localhost:5173/guide.html`.

## Table of contents

1. [Tech stack](#1-tech-stack)
2. [Project structure](#2-project-structure)
3. [Getting started](#3-getting-started)
4. [Routing with React Router](#4-routing-with-react-router)
5. [Firebase setup and environment variables](#5-firebase-setup-and-environment-variables)
6. [Global state with Context (AuthContext)](#6-global-state-with-context-authcontext)
7. [Login and sign up form](#7-login-and-sign-up-form)
8. [Logout and the Navbar](#8-logout-and-the-navbar)
9. [Protected routes](#9-protected-routes)
10. [How it all fits together](#10-how-it-all-fits-together)
11. [Common questions](#11-common-questions)

---

## 1. Tech stack

| Tool | What it does |
|------|--------------|
| **React 19** | UI library. The app is built from components. |
| **TypeScript** | JavaScript with types. Catches mistakes before you run the code. |
| **Vite** | Dev server and bundler. Fast startup and hot reload. |
| **React Router (`react-router-dom`)** | Shows different components for different URLs. |
| **Firebase Authentication** | Handles accounts, passwords and sessions. We don't build our own backend. |
| **Oxlint** | Linter that flags code problems (`npm run lint`). |

Concepts used: components, props, `useState`, `useEffect`, Context API, custom hooks, controlled inputs, conditional rendering, nested routes, environment variables.

---

## 2. Project structure

```
src/
├── main.tsx                  Entry point, renders <App />
├── App.tsx                   Router, AuthProvider and all routes
├── firebase-config.ts        Firebase setup, exports `auth`
├── context/
│   └── AuthContext.tsx       Global auth state + useAuth() hook
└── components/
    ├── Navbar.tsx            Links + login/logout button
    ├── Home.tsx              Public page
    ├── Login.tsx             Login / sign up form
    ├── Form.tsx              Protected page (logged-in users only)
    └── ProtectedRoute.tsx    The guard that protects routes
public/
└── guide.html                Standalone interactive guide (not part of the React app)
.env                          Your Firebase keys (not committed)
.env.example                  Template showing which keys are needed
```

---

## 3. Getting started

```bash
npm install
cp .env.example .env     # then fill in your Firebase values
npm run dev
```

In the [Firebase console](https://console.firebase.google.com): create a project, add a **Web app** to get the config values, then go to **Authentication → Sign-in method** and enable **Email/Password**.

Useful scripts: `npm run dev` (start), `npm run build` (production build), `npm run lint` (check code).

---

## 4. Routing with React Router

A single-page app has one HTML page. The router decides **which component to show** based on the URL, without reloading the page.

### `BrowserRouter`: turns routing on

```tsx
<BrowserRouter>
  ...everything that uses routing...
</BrowserRouter>
```

Wrap the app once, at the top. It watches the URL. `Routes`, `Route`, `Link`, `Navigate` and `Outlet` all need it.

### `Routes` and `Route`: URL → component

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
</Routes>
```

`path` is the URL and `element` is what to render when it matches.

### `Link`: navigate without reloading

```tsx
<Link to="/form">Form</Link>
```

Use `Link` instead of `<a href>`. A plain `<a>` reloads the whole page. `Link` just swaps the component.

### `useNavigate`: navigate from code

```tsx
const navigate = useNavigate()
navigate('/form')
```

Use it when you need to redirect after something happens, such as a successful login.

---

## 5. Firebase setup and environment variables

### `firebase-config.ts`

```ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ...
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

- `initializeApp` connects your code to your Firebase project.
- `getAuth(app)` gives you the **auth object**. You pass it to every Firebase auth function.
- `export` lets other files import it.

### `.env`: keeping config out of the code

```
VITE_FIREBASE_API_KEY=your-key-here
```

- Vite only exposes variables that start with **`VITE_`**.
- Read them with `import.meta.env.VITE_...`.
- `.env` is listed in `.gitignore`, so it isn't committed. `.env.example` is committed as a template.
- Restart `npm run dev` after changing `.env`.

> Firebase web keys are not secret. They end up in the browser anyway. Real protection comes from Firebase security rules. The `.env` file keeps config out of git and lets you use different projects for different environments.

---

## 6. Global state with Context (AuthContext)

### The problem

Many components need to know who is logged in: the Navbar, the login page and the route guard. Passing `user` down through props at every level is tedious ("prop drilling"). **Context** shares data with any component below it.

### The three pieces

```tsx
// 1. Create the context (an empty shared "channel")
const AuthContext = createContext<AuthContextValue | null>(null)

// 2. Provide a value to everything inside
<AuthContext.Provider value={{ user, signup, login, logout }}>
  {children}
</AuthContext.Provider>

// 3. Read the value from any component below
const ctx = useContext(AuthContext)
```

### `AuthProvider`: the state and the Firebase logic

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
```

- `user` is the logged-in Firebase user, or `null` if nobody is logged in.
- `loading` is `true` until Firebase tells us who is logged in.
- `children` is whatever you put between `<AuthProvider>` tags.

### Listening to login state

```tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser)
    setLoading(false)
  })
  return unsubscribe
}, [])
```

- `onAuthStateChanged` runs the callback on page load and every time someone logs in or out.
- `useEffect` with `[]` sets up the listener once, when the component first appears.
- The returned `unsubscribe` is the cleanup function. It stops the listener when the component disappears.
- Firebase remembers the session, so a page refresh keeps the user logged in.

### The Firebase actions

```tsx
const signup = async (email: string, password: string) => {
  await createUserWithEmailAndPassword(auth, email, password)
}
const login = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password)
}
const logout = async () => {
  await signOut(auth)
}
```

These are thin wrappers around Firebase. They are `async` because they talk to a server and return Promises. If they fail, for example with a wrong password, they **throw an error**. The component that calls them handles it.

You don't call `setUser` here. When Firebase logs someone in or out, `onAuthStateChanged` fires and updates `user` for you.

### Why wait for `loading`?

```tsx
if (loading) return null
```

On page load, Firebase needs a moment to check the saved session. Without this line, `user` would be `null` for a split second and a logged-in user would be redirected to `/login` on every refresh.

### `useAuth()`: a convenient way to read the context

```tsx
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

This is a **custom hook**, which is a function that wraps other hooks. It:
- keeps `AuthContext` private, so components only import `useAuth`,
- removes the `null` case, so TypeScript is happy and you don't check it everywhere,
- gives a clear error if you forget to wrap the app in `AuthProvider`.

Any component can now do:

```tsx
const { user, logout } = useAuth()
```

### Where the provider goes (`App.tsx`)

```tsx
<BrowserRouter>
  <AuthProvider>
    <Navbar />
    <Routes>...</Routes>
  </AuthProvider>
</BrowserRouter>
```

Everything inside `AuthProvider` can use `useAuth()`.

---

## 7. Login and sign up form

### Controlled inputs

```tsx
const [email, setEmail] = useState('')

<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

The input shows whatever is in state and updates the state on every keystroke. React is the "single source of truth" for the value.

### Toggling between Login and Sign up

```tsx
const [isSignup, setIsSignup] = useState(false)

<button type="button" onClick={() => setIsSignup(!isSignup)}>
  {isSignup ? 'Log in' : 'Sign up'}
</button>
```

One form handles both. The boolean decides the title, the button text and which function runs. `type="button"` stops this button from submitting the form.

### Submitting

```tsx
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
```

- `e.preventDefault()` stops the browser from reloading the page on submit.
- `await` waits for Firebase. If it throws, the `catch` block runs and shows an error. If not, `navigate('/form')` runs.
- `required` and `type="email"` on the inputs give free basic validation.

### Showing the error

```tsx
{error && <p>{error}</p>}
```

`&&` renders the paragraph only if `error` is not an empty string.

---

## 8. Logout and the Navbar

```tsx
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
```

- **Conditional rendering:** `condition ? A : B` shows one thing or the other.
- Logged in? Show a logout button with the user's email. Otherwise show a login link.
- Clicking logout calls Firebase's `signOut`. `onAuthStateChanged` then sets `user` to `null` and the Navbar re-renders by itself.

---

## 9. Protected routes

Goal: only logged-in users can see `/form`.

### The guard (`ProtectedRoute.tsx`)

```tsx
function ProtectedRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

- **`<Navigate to="/login" />`** redirects when rendered.
- **`replace`** swaps the current history entry instead of adding one. Without it, pressing Back would return to the protected page and bounce the user to `/login` again.
- **`<Outlet />`** is a placeholder for the child route. It renders the page that matched the URL.

### Using it (`App.tsx`)

```tsx
<Routes>
  {/* Public */}
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />

  {/* Protected */}
  <Route element={<ProtectedRoute />}>
    <Route path="/form" element={<Form />} />
  </Route>
</Routes>
```

- A `Route` with **no `path`** is a layout route. It doesn't match a URL itself and just wraps its children.
- When the URL is `/form`, React Router renders `ProtectedRoute` first. If the user is logged in, its `<Outlet />` shows `Form`. Otherwise the user is redirected.

### Protecting more pages

Put them inside the same wrapper. No other code changes:

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/form" element={<Form />} />
  <Route path="/profile" element={<Profile />} />
</Route>
```

> **Important:** route guards only hide pages in the UI. Anyone can still change frontend code in their browser. Real data must be protected on the server, for example with Firebase security rules.

---

## 10. How it all fits together

**Page load**
1. `AuthProvider` starts listening with `onAuthStateChanged`.
2. Firebase reports the saved user (or `null`) and `loading` becomes `false`.
3. The app renders, and `useAuth()` returns the correct `user`.

**Logging in**
1. The user submits the form and `login(email, password)` calls Firebase.
2. Firebase accepts it and `onAuthStateChanged` fires, so `user` is set.
3. Everything using `useAuth()` re-renders: the Navbar shows "Log out" and `ProtectedRoute` lets `/form` through.
4. `navigate('/form')` takes the user to the protected page.

**Logging out**
1. The user clicks the logout button and `signOut` runs.
2. `onAuthStateChanged` fires with `null`, and `user` becomes `null`.
3. The Navbar shows "Log in", and `ProtectedRoute` redirects to `/login` the next time it renders.

**Visiting `/form` while logged out**
`ProtectedRoute` sees `user === null` and renders `<Navigate to="/login" replace />`.

---

## 11. Common questions

**Why TypeScript?** It catches mistakes early (`login(123)` is an error), gives better autocomplete and documents your data shapes. Vite supports plain JavaScript too if you prefer.

**Do I need `AuthContext` with Firebase?** Firebase handles authentication, but you still need a way to share the current user with components. The context sets up one listener and shares the result everywhere.

**Why is `useAuth()` better than `useContext(AuthContext)`?** It hides the context, removes the `null` check from every component and gives a helpful error when used outside the provider.

**Where does `BrowserRouter` go?** Once, at the top of the app, above everything that uses routing.

**Is it safe to expose the Firebase API key?** Yes. It identifies your project and is not a password. Control access with Firebase security rules and by restricting the key's allowed domains in Google Cloud.

**Ideas to practice**
- Show a "Loading..." message instead of `null` while Firebase checks the session.
- Add a `/profile` page behind the guard.
- Add Google sign-in with `signInWithPopup`.
- Redirect logged-in users away from `/login`.
- Send the user back to the page they originally wanted after login.
