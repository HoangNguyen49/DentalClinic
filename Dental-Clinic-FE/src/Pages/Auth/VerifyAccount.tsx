import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyAccount: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Định nghĩa kiểu dữ liệu cho state để không bị lỗi TypeScript
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('Đang xác thực tài khoản...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Đường dẫn không hợp lệ (Thiếu token).');
            return;
        }

        // Thay localhost:8080 bằng URL Backend thực tế của bạn
        axios.post(`http://localhost:8080/api/auth/verify-account?token=${token}`)
            .then(() => {
                setStatus('success');
                setMessage('Kích hoạt tài khoản thành công!');
                
                // Chuyển về login sau 3s
                setTimeout(() => {
                    navigate('/login'); 
                }, 3000);
            })
            .catch((error: any) => {
                setStatus('error');
                // TypeScript cần check an toàn khi truy cập error.response
                const errorMsg = error.response?.data?.message || "Kích hoạt thất bại. Token có thể đã hết hạn.";
                setMessage(errorMsg);
            });
    }, [searchParams, navigate]);

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
                        <h2 style={{color: '#6c757d', marginBottom: '10px'}}>⏳ Đang xử lý...</h2>
                        <p>{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2 style={{color: '#28a745', marginBottom: '10px'}}>✅ Thành công!</h2>
                        <p>{message}</p>
                        <p style={{fontSize: '0.9em', color: '#888', marginTop: '15px'}}>
                            Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
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
                            Đăng nhập ngay
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 style={{color: '#dc3545', marginBottom: '10px'}}>❌ Thất bại</h2>
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
                            Về trang chủ
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyAccount;