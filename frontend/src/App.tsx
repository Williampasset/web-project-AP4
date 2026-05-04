import './App.css';
import { Route, Routes } from 'react-router';
import Login from './pages/login/Login';
import Affectation from './pages/Affectation/Affectation';
import Stock from './pages/Stock/Stock';
import Command from './pages/Command/Command';
import { ProtectedRoute } from './guards/ProtectedRoute';
import OperateurBoard from './pages/OperatorBoard/OperatorBoard';
import CommandDetailPage from './pages/CommandDetailPage/CommandDetailPage';
import { PublicRoute } from './guards/PublicRoute';
import DashboardRedirect from './pages/DashboardRedirect/DashboardRedirect';
// import PreparationPage from './pages/PreparationPage/PreparationPage';

function App() {
  return (
    <Routes>
      <Route path='/' element={<DashboardRedirect />}></Route>

      <Route
        path='/login'
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      ></Route>

      <Route
        path='/affectation'
        element={
          <ProtectedRoute>
            <Affectation />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path='/stock'
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path='/commande'
        element={
          <ProtectedRoute>
            <Command />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path='/operateur'
        element={
          <ProtectedRoute>
            <OperateurBoard />
          </ProtectedRoute>
        }
      ></Route>
      <Route
        path='/commande/:id'
        element={
          <ProtectedRoute>
            <CommandDetailPage />
          </ProtectedRoute>
        }
      ></Route>
      {/* <Route
        path='/preparation/:id'
        element={
          <ProtectedRoute>
            <PreparationPage />
          </ProtectedRoute>
        }
      ></Route> */}
    </Routes>
  );
}

export default App;
