import './App.css'
import { Route, Routes } from 'react-router'
import Login from './pages/login/Login'
import Affectation from './pages/Affectation/Affectation'
import Stock from './pages/Stock/Stock'

function App() {

  return (
    <Routes>
      <Route path="/" element={<Login/>}></Route>
      <Route path="/affectation" element={<Affectation/>}></Route>
      <Route path="/stock" element={<Stock/>}></Route>
    </Routes>
  )
}

export default App
