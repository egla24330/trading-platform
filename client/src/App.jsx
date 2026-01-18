import React from 'react'

import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from './context/AuthContext.jsx';
import Loading from './components/Loading.jsx';
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const CoinDetail = lazy(() => import("./pages/CoinDetail"));
const Login = lazy(() => import("./pages/Login"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const SignUp = lazy(() => import("./pages/SignUp"));

const Verify = lazy(() => import("./pages/EmailVerificationPage.jsx"));
const Reset = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const KYC = lazy(() => import("./pages/kyc"));
const N404 = lazy(() => import("./pages/N404"));
const Loan = lazy(() => import("./pages/Loan.jsx"));
const News = lazy(() => import("./pages/News"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminHome = lazy(() => import("./admin/page/AdminHome.jsx"));
import KYCVerificationPopup from './components/KYCVerificationPopup.jsx';
const LoanPayment = lazy(() => import("./pages/LoanPayment.jsx"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter.jsx"));






const App = () => {
  const {userData,token} = useAuth();
  const userRole = userData?.role ??""=== 'admin' ;

  return (
    <div>
      <ToastContainer />
      <Suspense fallback={<Loading text="Please wait..." />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/coin/:id" element={token ? <CoinDetail />: <SignUp/>} />
          <Route path="/login" element={token ? <Home /> : <Login />} />
          <Route path="/deposit" element={token ?<Deposit />: <SignUp /> } />
          <Route path="/withdraw" element={token?<Withdraw /> : <SignUp />} />
          <Route path="/signup" element={token ? <Home /> : <SignUp />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/kyc" element={<KYC />} />
          <Route path="/loan" element={token ?<Loan  />: <SignUp />} />
          <Route path="/news" element={<News />} />
          <Route path="/profile" element={token ?<Profile /> : <SignUp />}  />
          <Route path="/admin" element={userRole ? <AdminHome /> : <N404/>} />
          <Route path="/loan-payment" element={<LoanPayment />} />
          <Route path="/dashboard/notifications" element={<NotificationCenter/>} />
          <Route path="*" element={<N404 />} />




        </Routes>
      </Suspense>

          {!window.location.pathname.includes('/kyc') && <KYCVerificationPopup />}

    </div>
  )
}

export default App
