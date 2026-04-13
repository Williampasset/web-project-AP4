import './App.css'
import { Route, Routes } from 'react-router'
import Login from './pages/login/Login'
import Affectation from './pages/Affectation/Affectation'

function App() {

  return (
    <Routes>
      <Route path="/" element={<Login/>}></Route>
      <Route path="/affectation" element={<Affectation/>}></Route>
    </Routes>
  )
}

export default App
