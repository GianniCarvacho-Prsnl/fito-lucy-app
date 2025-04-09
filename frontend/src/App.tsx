import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PetList from './pages/PetList';
import PetDetail from './pages/PetDetail';
import PetForm from './pages/PetForm';
import Profile from './pages/Profile';
import CalendarPage from './pages/CalendarPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Rutas privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/pets"
            element={
              <PrivateRoute>
                <PetList />
              </PrivateRoute>
            }
          />
          <Route
            path="/pets/:id"
            element={
              <PrivateRoute>
                <PetDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/pets/new"
            element={
              <PrivateRoute>
                <PetForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/pets/edit/:id"
            element={
              <PrivateRoute>
                <PetForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <CalendarPage />
              </PrivateRoute>
            }
          />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
