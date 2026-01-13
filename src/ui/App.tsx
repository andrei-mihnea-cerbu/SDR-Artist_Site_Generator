import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout.tsx';

import NotFoundPage from './pages/NotFoundPage.tsx';
import HomePage from './pages/HomePage.tsx';
import DonatePage from './pages/DonatePage.tsx';
import DonateSuccessPage from './pages/DonateSuccessPage.tsx';
import DonateCancelPage from './pages/DonateCancelPage.tsx';

// MainLayout Wrapper
const MainWrapper = () => (
  <MainLayout>
    <Outlet />
  </MainLayout>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<MainWrapper />}>
          <Route index element={<HomePage />}></Route>
          <Route path={'donation'}>
            <Route index element={<DonatePage />} />
            <Route path={'success'} element={<DonateSuccessPage />} />
            <Route path={'cancel'} element={<DonateCancelPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
