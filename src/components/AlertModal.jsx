import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

const AlertModal = ({
    isOpen, title, message, type = 'success',
    onConfirm, confirmText = "OK", confirmStyle = "btn-primary",
    onCancel, showCancel = false, cancelText = "Cancel",
    onSave, showSave = false, saveText = "Save"
}) => {
    if (!isOpen) return null;

    const getIconColor = () => {
        if (type === 'success') return '#10b981';
        if (type === 'warning') return '#eab308'; // yellow-500
        return '#ef4444'; // red-500
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ animation: 'modalPopup 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
                    <img src="/logo.png" alt="Suryodhaya Green Solar Logo" className="responsive-logo logo-alert" />
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-color)' }}>Suryodhaya Green Solar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: getIconColor() }}>
                    {type === 'success' && <CheckCircle2 size={48} />}
                    {type === 'warning' && <AlertTriangle size={48} />}
                    {type === 'error' && <AlertCircle size={48} />}
                </div>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem', color: 'black' }}>{title}</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {showCancel && (
                        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1, minWidth: '80px', justifyContent: 'center' }}>{cancelText}</button>
                    )}
                    {showSave && (
                        <button className="btn btn-primary" onClick={onSave} style={{ flex: 1, minWidth: '80px', justifyContent: 'center' }}>{saveText}</button>
                    )}
                    <button className={`btn ${confirmStyle}`} onClick={onConfirm} style={{ flex: 1, minWidth: '80px', justifyContent: 'center' }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
