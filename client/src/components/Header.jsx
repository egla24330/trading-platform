import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  Wallet,
  User,
  ChevronDown,
  Menu,
  X,
  Coins,
  History,
  LogOut,
  TrendingUp,
  Trophy,
  Gift,
  Sparkles,
  PiggyBank,
  LogIn,


} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import NotificationBell from './NotificationBell';



const Header = () => {
  const { isLogin, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
   
    { name: 'News', href: '#live', featured: true, icon: <TrendingUp className="w-4 h-4" /> },
  ];



  const gamesDropdown = [
  
  ];

  const walletOptions = [
    { name: 'Profile', action: () => navigate('/profile'), icon: <User className="w-4 h-4" /> },
    { name: 'Loans', action: () => navigate('/loan'), icon: <PiggyBank className="w-4 h-4" /> },
    { name: 'Deposit', action: () => navigate('/deposit'), icon: <Coins className="w-4 h-4" /> },
    { name: 'Withdraw', action: () => navigate('/Withdraw'), icon: <Wallet className="w-4 h-4" /> },

    { name: 'Transaction History', action: () => alert('History'), icon: <History className="w-4 h-4" /> },

    {
      name: 'Logout', action: () => {
        // Clear user data and tokenlocalStorage.removeItem('registerEmail')
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
        toast.info('Logout successfully')
        window.location.reload();
      }, icon: <LogOut className="w-4 h-4" />
    },
  ];

  return (

    <header className={`p-1 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
      ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-800'
      : 'bg-transparent'
      }`}>
      {
        /*fixed top-0*/
      }

      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
             
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Logo
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 ml-8">
              {navigation.map((item) => (
                <div key={item.name} className="relative group">
                  <p
                    // href={item.href}
                    onClick={() => navigate(`/${item.name}`)}
                    className={`flex cursor-pointer items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${item.featured
                      ? 'text-cyan-400 hover:text-cyan-300'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    {item.dropdown && (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    )}
            
                  </p>

                  {/* Dropdown Menu for Games */}
         
                </div>
              ))}
            </nav>
          </div>

          {/* Desktop Right Section */}

          {
            isLogin ?
              (
                <div className="hidden md:flex items-center space-x-4">
                  <NotificationBell />
    

                  {/* Wallet Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      <Menu className="w-5 h-5" />
                    
                    </button>

                    {/* Wallet Dropdown */}
                    {true && (
                      <div className={`${isWalletDropdownOpen ? '' : 'invisible'} z-50  absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl`}>
                        {/* // <div className="p-4 border-b  border-gray-700"> */}
                        <div className="">
                          
                        </div>

                        <div className="p-2">
                          {walletOptions.map((option) => (
                            <button
                              key={option.name}
                              onClick={(e) => {

                                option.action();
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-white"
                            >
                              {option.icon}
                              <span>{option.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              )
              :

              (
                <button
                  className=' text-white w-[110px] bg-blue-500 p-2 font-bold rounded-full cursor-pointer hidden md:block'
                  onClick={() => navigate('/signup')}>
                  Get start
                </button>
              )

          }

          <div className='sm:hidden '>
            {token && <NotificationBell />}
          </div>


        
          {!isLogin && (
            <button
              onClick={() => navigate('/login')}
              className="sm:hidden px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all"
            >
              Get Started
            </button>


          )}
        </div>

        {/* Mobile Menu */}
        {true && (
          <div className={`${isMenuOpen ? 'max-h-screen' : 'hidden'} overflow-hidden transition-all duration-300 lg:hidden bg-gray-900 border-t border-gray-800 bg-amber-200`}>
            {/* Mobile Navigation */}
            <nav className="py-4"


            >
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span className={item.featured ? 'text-cyan-400' : ''}>
                      {item.name}
                    </span>
                  </div>
                  {item.featured && (
                    <span className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                      HOT
                    </span>
                  )}
                </a>
              ))}
            </nav>

            {/* Mobile Wallet Section */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-4">
          
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 gap-2  z-10">
                <button

                  className="flex z-50 items-center justify-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors text-white font-sm"
                  onClick={() => {
                    navigate('/deposit')

                  }}
                >
                  <Coins className="w-4 h-4" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/withdraw')

                  }}

                  className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-600 hover:border-cyan-400 rounded-lg transition-colors text-white font-sm z-50">
                  <Wallet className="w-4 h-4" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for dropdowns */}
      {(isWalletDropdownOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsWalletDropdownOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;