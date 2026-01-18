import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { PriceFeedProvider } from './context/PriceFeedContext';
import { AuthProvider } from './context/AuthContext.jsx'
import { KYCProvider } from './context/KYCContext.jsx'
import { OrdersProvider } from './context/OrdersContext.jsx'
createRoot(document.getElementById('root')).render(

    <PriceFeedProvider>
        <AuthProvider>
            <KYCProvider>
                <OrdersProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </OrdersProvider>
            </KYCProvider>
        </AuthProvider>
    </PriceFeedProvider>
)

