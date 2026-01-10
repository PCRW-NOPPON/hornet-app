import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CaseProvider } from './context/CaseContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import CaseOverview from './pages/CaseOverview';
import CaseData from './pages/CaseData';
import CaseDocuments from './pages/CaseDocuments';
import CaseCollect from './pages/CaseCollect';
import './styles/globals.css';

function App() {
  return (
    <CaseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/cases" replace />} />
            <Route path="/cases" element={<Dashboard />} />
            <Route path="/cases/:caseId" element={<CaseDetail />}>
              <Route index element={<CaseOverview />} />
              <Route path="data" element={<CaseData />} />
              <Route path="documents" element={<CaseDocuments />} />
              <Route path="collect" element={<CaseCollect />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </CaseProvider>
  );
}

export default App;
