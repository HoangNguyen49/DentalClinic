import React, { useEffect, useState } from 'react';
import { X, User, Phone, MapPin, Calendar, Mail, Save, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Import
import { receptionApi } from '../receptionApi';
import { type PatientResponse } from './PatientList';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patient: PatientResponse | null;
    onUpdateSuccess: () => void; 
}

export default function PatientDetailModal({ isOpen, onClose, patient, onUpdateSuccess }: Props) {
    const { t } = useTranslation("reception"); // Hook
    const [formData, setFormData] = useState<PatientResponse | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(patient);
        setIsEditing(false); 
    }, [patient, isOpen]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!formData) return;

        const name = formData.fullName ? formData.fullName.trim() : "";
        const phone = formData.phone ? formData.phone.trim() : "";

        if (!name || !phone) {
            toast.warning(t("patientDetail.messages.validation"));
            return;
        }

        setSaving(true);
        try {
            await receptionApi.updatePatient(formData.id, formData);
            
            toast.success(t("patientDetail.messages.success"));
            onUpdateSuccess(); 
            setIsEditing(false); 
        } catch (error) {
            console.error(error);
            toast.error(t("patientDetail.messages.error"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{t("patientDetail.title")}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-blue-100 text-blue-700 text-xs font-mono px-2 py-0.5 rounded border border-blue-200">
                                {formData.patientCode}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {formData.isActive ? t("patients.status.active") : t("patients.status.inactive")}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                    
                    {/* Họ tên */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("patientDetail.labels.fullName")} <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input 
                                type="text" name="fullName"
                                value={formData.fullName || ''} onChange={handleChange} disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-transparent text-gray-600'}`}
                            />
                        </div>
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("patientDetail.labels.phone")} <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input 
                                type="text" name="phone"
                                value={formData.phone || ''} onChange={handleChange} disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-transparent text-gray-600'}`}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("patientDetail.labels.email")}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input 
                                type="email" name="email"
                                value={formData.email || ''} onChange={handleChange} disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-transparent text-gray-600'}`}
                            />
                        </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("patientDetail.labels.dob")}</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input 
                                type="date" name="dateOfBirth"
                                value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''} 
                                onChange={handleChange} disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-transparent text-gray-600'}`}
                            />
                        </div>
                    </div>

                    {/* Giới tính */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("patientDetail.labels.gender")}</label>
                        <div className="relative">
                            <select 
                                name="gender"
                                value={formData.gender || 'Unspecified'} onChange={handleChange} disabled={!isEditing}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-transparent text-gray-600'}`}
                            >
                                <option value="Nam">{t("patientDetail.gender.male")}</option>
                                <option value="Nữ">{t("patientDetail.gender.female")}</option>
                                <option value="Khác">{t("patientDetail.gender.other")}</option>
                                <option value="Unspecified">{t("patientDetail.gender.unspecified")}</option>
                            </select>
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("patientDetail.labels.address")}</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                            <input 
                                type="text" name="address"
                                value={formData.address || ''} onChange={handleChange} disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-transparent text-gray-600'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                    {!isEditing ? (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition">{t("patientDetail.buttons.close")}</button>
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 transition active:scale-95"
                            >
                                <Edit2 size={16}/> {t("patientDetail.buttons.edit")}
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => { setIsEditing(false); setFormData(patient); }} 
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                            >
                                {t("patientDetail.buttons.cancel")}
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm flex items-center gap-2 transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={16}/>
                                )}
                                {t("patientDetail.buttons.save")}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}