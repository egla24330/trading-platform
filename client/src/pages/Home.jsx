import React from 'react'
import CoinList from '../components/coin/CoinList'
import Header from '../components/Header'
import Hero from '../components/Hero'

import MobileNav from '../components/MobileNav'
import GetStart from '../components/GetStart'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import VerifyAccountModal from '../components/VerifyAccountModal'


const Home = () => {
  const { isLogin,userData } = useAuth();
  // const [verifyOpen, setVerifyOpen] = useState(true);

  const verifyOpen = isLogin && userData && !userData.isAccountVerified;

  return (
    <div className="bg-gray-900 mb-20">
      <Header />
      <Hero />
      <CoinList />
      <MobileNav />


      {!isLogin && <GetStart />}



      <VerifyAccountModal
        open={verifyOpen}
        
      />


    </div>
  )
}

export default Home
