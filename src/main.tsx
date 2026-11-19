import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  createHashRouter,
  RouterProvider,
} from 'react-router-dom'
import '@fontsource/noto-sans/latin-400.css'
import '@fontsource/noto-sans/latin-600.css'
import '@fontsource/noto-sans/latin-700.css'
import { App } from './pages'
import './styles.css'

const createRouter =
  import.meta.env.MODE === 'pages' ? createHashRouter : createBrowserRouter
const router = createRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
