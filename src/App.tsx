import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddBill from './pages/AddBill';
import BillList from './pages/BillList';
import Statistics from './pages/Statistics';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddBill />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
