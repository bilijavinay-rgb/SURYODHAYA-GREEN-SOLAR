import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, History, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { getInvoices } from '../utils/helpers';

const Dashboard = ({ activeTab, setActiveTab, onCreateNewInvoice, onBackToDashboard, children }) => {
    const [totalInvoices, setTotalInvoices] = useState(0);

    useEffect(() => {
        if (activeTab === 'home') {
            getInvoices().then(data => setTotalInvoices(data.length));
        }
    }, [activeTab]);

    if (activeTab === 'home') {
        return (
            <div className="landing-container">
                <header className="landing-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div className="logo">
                            <img src="/logo.png" alt="Suryodhaya Green Solar Logo" className="responsive-logo logo-main" />
                            <span>Suryodhaya Green Solar</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button onClick={() => setActiveTab('recyclebin')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                            <Trash2 size={20} />
                            <span className="hide-on-mobile">Recycle Bin</span>
                        </button>
                        <button onClick={() => setActiveTab('template')} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', color: 'var(--primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                            <FileText size={20} />
                            <span className="hide-on-mobile">Edit Template</span>
                        </button>
                    </div>
                </header>

                <main className="landing-main">
                    <div className="landing-content">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="landing-title"
                        >
                            Welcome to Suryodhaya Green Solar
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="landing-subtitle"
                        >
                            Manage your invoicing needs quickly and efficiently.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '3rem' }}
                        >
                            <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '1rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Owner</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Doranala Gowthami</p>
                            </div>
                            <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '1rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Manager</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>B Ramesh</p>
                            </div>
                        </motion.div>

                        <div className="landing-grid">
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log("Create New Invoice button clicked, calling prop...");
                                    if (onCreateNewInvoice) {
                                        console.log("onCreateNewInvoice exists, invoking...");
                                        onCreateNewInvoice();
                                    } else {
                                        console.log("onCreateNewInvoice prop is missing!");
                                    }
                                }}
                                className="landing-card create-card"
                            >
                                <div className="card-icon-wrapper">
                                    <PlusCircle size={48} />
                                </div>
                                <h2>Create New Invoice</h2>
                                <p>Generate a new GST invoice with custom details and items.</p>
                            </motion.button>

                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                onClick={() => setActiveTab('history')}
                                className="landing-card history-card"
                            >
                                <div className="card-icon-wrapper">
                                    <History size={48} />
                                </div>
                                <h2>View History</h2>
                                <p>Access, view, and redownload your previously saved invoices.</p>
                            </motion.button>

                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Sub-page full screen view
    return (
        <div className="subpage-container">
            <header className="subpage-header no-print">
                <button onClick={onBackToDashboard || (() => setActiveTab('home'))} className="btn-back">
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <div className="logo sublogo">
                    <img src="/logo.png" alt="Suryodhaya Green Solar Logo" className="responsive-logo logo-sub" />
                    <span>Suryodhaya Green Solar</span>
                </div>
            </header>
            <main className="subpage-main">
                {children}
            </main>
        </div>
    );
};

export default Dashboard;
