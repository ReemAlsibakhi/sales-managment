import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import EmployeeLogin from './pages/EmployeeLogin';
import StoreDashboard from './pages/StoreDashboard';

function AppRouter() {
  const { session, logout, saveSession } = useAuth();

  if (!session) return <LoginPage />;

  if (session.type === 'admin') {
    return <AdminPanel onLogout={logout} />;
  }

  if (session.type === 'store' && !session.employee) {
    return (
      <EmployeeLogin
        session={session}
        onLogin={(emp) => saveSession({ ...session, employee: emp, empName: emp.name, empId: emp.id, empRole: emp.role })}
        onStoreLogout={logout}
      />
    );
  }

  if (session.type === 'store' && session.employee) {
    return (
      <StoreDashboard
        session={session}
        onEmployeeLogout={() => saveSession({ ...session, employee: null, empName: null, empId: null, empRole: null })}
        onStoreLogout={logout}
      />
    );
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
