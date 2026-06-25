import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Recommendations } from './pages/Recommendations';
import { Profile } from './pages/Profile';
import { Onboarding } from './pages/Onboarding';

function App() {
  const hasUser = !!localStorage.getItem('saathi_user');

  return (
    <Router>
      <Routes>
        <Route 
          path="/onboarding" 
          element={hasUser ? <Navigate to="/" replace /> : <Onboarding />} 
        />
        <Route
          path="/*"
          element={
            hasUser ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/onboarding" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
