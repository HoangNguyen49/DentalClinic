import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form'; 
import { toast, ToastContainer } from 'react-toastify';
import Header from '../../../widgets/Header/Header';
import Footer from '../../../widgets/Footer/Footer';
import patientProfileApi from '../../../patient_api/patientProfileApi';
import type { PatientProfile } from '../../types/patientProfile';
// Import hook
import { useTranslation } from 'react-i18next';

const PatientProfilePage: React.FC = () => {
    const { t } = useTranslation(["patient-profile"]);
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    // Form Hook
    const { register, handleSubmit, reset } = useForm<PatientProfile>();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) { navigate("/login"); return; }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await patientProfileApi.getProfile();
            setProfile(data);
            reset(data); 
        } catch (error) {
            toast.error(t('messages.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: PatientProfile) => {
        try {
            await patientProfileApi.updateProfile(data);
            toast.success(t('messages.updateSuccess'));
            setProfile(data); 
            setIsEditing(false); 
        } catch (error) {
            toast.error(t('messages.updateError'));
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3366FF]"></div></div>;

    return (
        <>
            <Header />
            <ToastContainer />
            <div className="min-h-screen bg-gray-50 py-10 px-4 font-instrument">
                <div className="max-w-4xl mx-auto">
                    
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">📋 {t('title')}</h1>
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="bg-[#3366FF] text-white px-5 py-2 rounded-xl font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                {t('btnEdit')}
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setIsEditing(false); reset(profile!); }}
                                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-xl font-bold hover:bg-gray-300 transition"
                            >
                                {t('btnCancel')}
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                        
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="bg-white p-1 rounded-full">
                                    <img 
                                        src={ localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).avatarUrl || "https://ui-avatars.com/api/?name=" + profile?.fullName : ""} 
                                        className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gray-200"
                                        alt="Avatar"
                                    />
                                </div>
                                <div className="mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                                        {t('patientCode')}: {profile?.patientCode || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('fields.fullName')}</label>
                                        <input 
                                            {...register("fullName", { required: true })}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('fields.phone')}</label>
                                        <input 
                                            {...register("phone")}
                                            disabled={true} 
                                            className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                        {isEditing && <p className="text-xs text-gray-400 mt-1">{t('fields.phoneHint')}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('fields.gender')}</label>
                                        <select 
                                            {...register("gender")}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500 appearance-none'}`}
                                        >
                                            <option value="">{t('fields.genderOptions.default')}</option>
                                            <option value="Nam">{t('fields.genderOptions.male')}</option>
                                            <option value="Nữ">{t('fields.genderOptions.female')}</option>
                                            <option value="Khác">{t('fields.genderOptions.other')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('fields.dob')}</label>
                                        <input 
                                            type="date"
                                            {...register("dateOfBirth")}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">{t('fields.address')}</label>
                                        <input 
                                            type="text"
                                            {...register("address")}
                                            disabled={!isEditing}
                                            placeholder={t('fields.addressPlaceholder')}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            {t('fields.note')}
                                            <span className="font-normal text-gray-400 ml-2 text-xs">{t('fields.noteHint')}</span>
                                        </label>
                                        <textarea 
                                            {...register("note")}
                                            disabled={!isEditing}
                                            rows={4}
                                            placeholder={t('fields.notePlaceholder')}
                                            className={`w-full px-4 py-3 rounded-xl border ${isEditing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white' : 'border-transparent bg-gray-50 text-gray-500'}`}
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mt-8 flex justify-end">
                                        <button 
                                            type="submit"
                                            className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition transform hover:scale-105"
                                        >
                                            {t('btnSave')}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PatientProfilePage;