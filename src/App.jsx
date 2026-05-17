import { RouterProvider } from 'react-router-dom'
import { router } from './routes/AppRoute'
import { DTMISToastContainer } from './components/DTMISToast'
import './css/App.css'
import ReactModal from './components/ReactModal'

function App() {
  return (
    <>
      <DTMISToastContainer />
      <RouterProvider router={router} />
    </>
  )
}

export default App
