import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// 1. Import hook
import { useTranslation } from 'react-i18next';

const VerifyAccount: React.FC = () => {
    // 2. Setup hook với namespace "login"
    const { t } = useTranslation(["login"]);
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');

    // Set message mặc định khi component mount (để tránh lỗi hydration hoặc text trắng)
    useEffect(() => {
        if (status === 'loading') {
            setMessage(t('login:verify.loadingMsg'));
        }
    }, [t, status]);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage(t('login:verify.errorToken'));
            return;
        }

        axios.post(`${API_URL}/api/auth/verify-account?token=${token}`)
            .then(() => {
                setStatus('success');
                setMessage(t('login:verify.successMsg'));
                
                setTimeout(() => {
                    navigate('/login'); 
                }, 3000);
            })
            .catch((error: any) => {
                setStatus('error');
                const errorMsg = error.response?.data?.message || t('login:verify.errorDefault');
                setMessage(errorMsg);
            });
    }, [searchParams, navigate, t, API_URL]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            flexDirection: 'column',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f8f9fa'
        }}>
            <div style={{ 
                padding: '40px', 
                borderRadius: '10px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                textAlign: 'center',
                backgroundColor: 'white',
                maxWidth: '400px',
                width: '90%'
            }}>
                {status === 'loading' && (
                    <>
                        <h2 style={{color: '#6c757d', marginBottom: '10px'}}>⏳ {t('login:verify.loadingTitle')}</h2>
                        <p>{message || t('login:verify.loadingMsg')}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2 style={{color: '#28a745', marginBottom: '10px'}}>✅ {t('login:verify.successTitle')}</h2>
                        <p>{message}</p>
                        <p style={{fontSize: '0.9em', color: '#888', marginTop: '15px'}}>
                            {t('login:verify.redirect')}
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '10px 20px', 
                                marginTop: '20px', 
                                cursor: 'pointer', 
                                backgroundColor: '#007bff', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            {t('login:verify.btnLogin')}
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 style={{color: '#dc3545', marginBottom: '10px'}}>❌ {t('login:verify.errorTitle')}</h2>
                        <p>{message}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '10px 20px', 
                                marginTop: '20px', 
                                cursor: 'pointer', 
                                backgroundColor: '#6c757d', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '5px'
                            }}
                        >
                            {t('login:verify.btnHome')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyAccount;