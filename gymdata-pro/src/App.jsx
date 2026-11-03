import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Legajo from './pages/Legajo';
import Gimnastas from './pages/Gimnastas';
import Entrenadores from './pages/Entrenadores';
import Grupos from './pages/Grupos';
import Asistencia from './pages/Asistencia';
import Historial from './pages/Historial';
import Usuarios from './pages/Usuarios';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="legajo" element={<Legajo />} />
              <Route path="gimnastas" element={<Gimnastas />} />
              <Route path="entrenadores" element={<Entrenadores />} />
              <Route path="grupos" element={<Grupos />} />
              <Route path="asistencia" element={<Asistencia />} />
              <Route path="historial" element={<Historial />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}