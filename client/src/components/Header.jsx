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
  const { isLogin,token } = useAuth();
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
    // { name: 'Games', href: '#games', dropdown: true, icon: <Sparkles className="w-4 h-4" /> },
    // { name: 'Sports', href: '#sports', icon: <Trophy className="w-4 h-4" /> },
    { name: 'News', href: '#live', featured: true, icon: <TrendingUp className="w-4 h-4" /> },
    // { name: 'Promotions', href: '#promotions', icon: <Gift className="w-4 h-4" /> },
  ];



  const gamesDropdown = [
    { name: 'Slots', href: '#slots', icon: '🎰' },
    { name: 'Dice', href: '#dice', icon: '🎲' },
    { name: 'Roulette', href: '#roulette', icon: '🎯' },
    { name: 'Blackjack', href: '#blackjack', icon: '♠️' },
    { name: 'Crash', href: '#crash', icon: '🚀' },
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
      ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-800'
      : 'bg-transparent'
      }`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CB</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                yoswap
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
                    {/* {item.featured && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                        HOTa
                      </span>
                    )} */}
                  </p>

                  {/* Dropdown Menu for Games */}
                  {item.dropdown && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-2">
                        {gamesDropdown.map((game) => (
                          <p
                            onClick={() => toast.info('coming soon!!')}
                            key={game.name}
                            //href={game.href}
                            className="flex items-center px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors group"
                          >
                            <span className="text-lg mr-3">{game.icon}</span>
                            <div>
                              <div className="text-white font-medium group-hover:text-cyan-400">
                                {game.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                Provably fair
                              </div>
                            </div>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
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
                  {/* Balance Display */}
                  {/* <div className="bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-300">Balance:</span>
                      <span className="text-white font-semibold">0 USDT</span>
                    </div>
                  </div> */}

                  {/* Wallet Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      <Menu className="w-5 h-5" />
                      {/* <span className="font-medium">0x7f3...c4a2</span> */}
                      {/* <ChevronDown className="w-4 h-4" /> */}
                    </button>

                    {/* Wallet Dropdown */}
                    {true && (
                      <div className={`${isWalletDropdownOpen ? '' : 'invisible'} z-50  absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl`}>
                        {/* // <div className="p-4 border-b  border-gray-700"> */}
                        <div className="">
                          {/* <div className="flex items-center space-x-3">
                            <User className="w-10 h-10 text-cyan-400" />
                            <div>
                              <div className="text-white font-medium">TEST0x7f3...c4a222</div>
                              <div className="text-sm text-cyan-400">$0.00</div>
                            </div>
                          </div> */}
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
           {token && <NotificationBell/>}
      </div>


          {/* Mobile menu button */}
          {/* <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button> */}
          {!isLogin && (
            <button
              onClick={() => navigate('/login')}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors bg-blue-500 text-white font-bold"
            >
              Get Start
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



            {/* Mobile Games Dropdown */}
            {/* <div className="px-4 py-2 border-t border-gray-800">
              <div className="text-sm font-medium text-gray-400 mb-2">Games</div>
              <div className="grid grid-cols-2 gap-2">
                {gamesDropdown.map((game) => (
                  <a
                    key={game.name}
                    href={game.href}
                    className="flex items-center p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-lg mr-2">{game.icon}</span>
                    <span className="text-white text-sm">{game.name}</span>
                  </a>
                ))}
              </div>
            </div> */}

            {/* Mobile Wallet Section */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center justify-between mb-4">
                {/* <div className="flex items-center space-x-2">
                  <User className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="text-white text-sm font-medium">0x7f3...c4a255</div>
                    <div className="text-cyan-400 text-xs">$1,245.32</div>
                  </div>
                </div> */}
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