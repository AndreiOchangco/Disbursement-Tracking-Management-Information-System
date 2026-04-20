import { RouterProvider } from 'react-router-dom'
import { router } from './routes/AppRoute'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './css/App.css'
import ReactModal from './components/ReactModal'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}

export default App
