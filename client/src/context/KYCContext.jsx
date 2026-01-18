// src/context/KYCContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";


const KYCContext = createContext();

export const useKYC = () => useContext(KYCContext);

export const KYCProvider = ({ children }) => {
    const { backendUrl } = useAuth()
    const [kycStatus, setKycStatus] = useState(null); // 'not_submitted' | 'pending' | 'restricted' | 'rejected |verified |default'
    const [showModal, setShowModal] = useState(false);
    const token = localStorage.getItem("token");

    const fetchKYCStatus = async () => {
        if (!token) {
            console.warn("No authentication token found. Skipping KYC status fetch.");
            return;
        }

        try {
            const  res  = await axios.get(`${backendUrl}api/kyc/statusff/ll/`, {
               // headers: { Authorization: `Bearer ${token}` }
            });
            console.log(res)

            console.log(res.data.kycStatus)

            if (!res.data.kycStatus) {
                console.warn("KYC status missing in response.");
                return;
            }

            setKycStatus(res.data.kycStatus);

            // Show KYC modal only for "not_submitted" or "pending"
            if (["not_submitted", "pending","restricted","rejected","restricted"].includes(res.data.kycStatus)) {
                setShowModal(true);
            } else {
                setShowModal(false); // Hide modal if verified
            }
        } catch (err) {
            console.error("Error fetching KYC status:", err.response?.data || err.message);
            toast.error(err.message||'server error')

        }
    };


    useEffect(() => {
        if (token) {
            fetchKYCStatus();
        }
    }, [token]);

    return (
        <KYCContext.Provider
            value={{
                kycStatus,
                setKycStatus,
                showModal,
                setShowModal,
                fetchKYCStatus
            }}
        >
            {children}
        </KYCContext.Provider>
    );
};
