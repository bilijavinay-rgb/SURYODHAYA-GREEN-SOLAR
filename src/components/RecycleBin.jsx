import React, { useState, useEffect } from 'react';
import { getRecycledInvoices, formatCurrency, restoreInvoice, deleteInvoicePermanently } from '../utils/helpers';
import { format } from 'date-fns';
import { Eye, RotateCcw, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import InvoicePreview from './InvoicePreview';
import AlertModal from './AlertModal';

const RecycleBin = () => {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [previewInvoiceModal, setPreviewInvoiceModal] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, invoice: null });
    const [restoreAlert, setRestoreAlert] = useState({ isOpen: false, invoice: null });
    const [isLoading, setIsLoading] = useState(true);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchInvoices = async () => {
            setIsLoading(true);
            const data = await getRecycledInvoices();
            setInvoices(data);
            setIsLoading(false);
        };
        fetchInvoices();
    }, []);

    const confirmRestore = async () => {
        if (!restoreAlert.invoice) return;

        setRestoreAlert({ isOpen: false, invoice: null });
        setIsRestoring(true);

        const success = await restoreInvoice(restoreAlert.invoice);

        await new Promise(resolve => setTimeout(resolve, 800));

        if (success) {
            setInvoices((prev) => prev.filter((inv) => inv.invoiceNo !== restoreAlert.invoice.invoiceNo));
        } else {
            alert("Failed to restore invoice.");
        }
        setIsRestoring(false);
    };

    const confirmDelete = async () => {
        if (!deleteAlert.invoice) return;

        setDeleteAlert({ isOpen: false, invoice: null });
        setIsDeleting(true);

        const success = await deleteInvoicePermanently(deleteAlert.invoice.invoiceNo);

        await new Promise(resolve => setTimeout(resolve, 800));

        if (success) {
            setInvoices((prev) => prev.filter((inv) => inv.invoiceNo !== deleteAlert.invoice.invoiceNo));
        } else {
            alert("Failed to permanently delete invoice.");
        }
        setIsDeleting(false);
    };

    const handleRestoreClick = (invoice, e) => {
        e.stopPropagation();
        setRestoreAlert({ isOpen: true, invoice });
    };

    const handleDeleteClick = (invoice, e) => {
        e.stopPropagation();
        setDeleteAlert({ isOpen: true, invoice });
    };

    // Filter logic
    const filteredInvoices = invoices.filter(invoice => {
        const term = searchTerm.toLowerCase();
        const clientNameMatch = invoice.buyer?.name?.toLowerCase().includes(term);
        const invoiceNoMatch = invoice.invoiceNo?.toLowerCase().includes(term);
        return !searchTerm || clientNameMatch || invoiceNoMatch;
    });

    return (
        <div className="history-container">
            <div className="header-actions" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <h2>Recycle Bin</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', minWidth: '250px' }}>
                        <input
                            type="text"
                            placeholder="Search by name or invoice no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', height: '42px' }}
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div className="app-spinner" style={{ marginBottom: '1rem' }}></div>
                    <p style={{ fontSize: '1.1rem' }}>Fetching deleted invoices...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="empty-state">
                    <p>Your recycle bin is empty.</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="empty-state">
                    <p>No results found for "{searchTerm}".</p>
                </div>
            ) : (
                <div className="table-responsive card" style={{ padding: 0 }}>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Date Deleted</th>
                                <th>Client Name</th>
                                <th>Total Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice, index) => (
                                <tr key={invoice.invoiceNo || index}>
                                    <td className="font-medium text-primary">{invoice.invoiceNo}</td>
                                    <td>{invoice.deletedAt ? format(new Date(invoice.deletedAt), 'dd MMM yyyy, HH:mm') : 'N/A'}</td>
                                    <td>{invoice.buyer?.name || 'N/A'}</td>
                                    <td className="font-bold">
                                        {formatCurrency(
                                            invoice.items?.reduce((sum, item) => {
                                                const amount = item.qty * item.rate;
                                                const tax = (amount * item.gstRate) / 100;
                                                return sum + amount + tax;
                                            }, 0) || 0
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons-sm">
                                            <button
                                                className="btn-icon"
                                                title="View PDF"
                                                onClick={() => setPreviewInvoiceModal(invoice)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Restore"
                                                onClick={(e) => handleRestoreClick(invoice, e)}
                                                style={{ color: '#10b981' }} // Emerald color
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                            <button
                                                className="btn-icon btn-danger"
                                                title="Delete Permanently"
                                                onClick={(e) => handleDeleteClick(invoice, e)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AlertModal
                isOpen={restoreAlert.isOpen}
                title="Restore Invoice"
                message={`Are you sure you want to restore Invoice ${restoreAlert.invoice?.invoiceNo || ''}? It will be moved back to the History view.`}
                type="success"
                confirmText="Restore"
                confirmStyle="btn-primary" // Using standard primary styling to signify positive action
                onConfirm={confirmRestore}
                showCancel={true}
                cancelText="Cancel"
                onCancel={() => setRestoreAlert({ isOpen: false, invoice: null })}
            />

            <AlertModal
                isOpen={deleteAlert.isOpen}
                title="Delete Permanently"
                message={`Are you sure you want to PERMANENTLY delete Invoice ${deleteAlert.invoice?.invoiceNo || ''}? This action cannot be undone.`}
                type="error"
                confirmText="Delete Permanently"
                confirmStyle="btn-danger"
                onConfirm={confirmDelete}
                showCancel={true}
                cancelText="Cancel"
                onCancel={() => setDeleteAlert({ isOpen: false, invoice: null })}
            />

            {previewInvoiceModal && (
                <div className="modal-overlay" style={{ zIndex: 9999, overflowY: 'auto', alignItems: 'flex-start', padding: '2rem 1rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '850px', margin: '0 auto' }}>
                        <button
                            onClick={() => setPreviewInvoiceModal(null)}
                            className="btn-icon"
                            style={{ position: 'absolute', right: '-0.5rem', top: '-0.5rem', zIndex: 10, background: 'var(--bg-card)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '0.4rem' }}
                            title="Close Preview"
                        >
                            <X size={16} />
                        </button>
                        <div className="preview-scale-wrapper" style={{ transform: 'none', margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                            <InvoicePreview data={previewInvoiceModal} />
                        </div>
                    </div>
                </div>
            )}

            {isRestoring && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem', minWidth: '350px' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid rgba(16, 185, 129, 0.2)', // emerald-500
                                borderTop: '4px solid #10b981',
                                borderRadius: '50%'
                            }}
                        />
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.5' }}
                        >
                            Restoring Invoice...<br />Please wait.
                        </motion.h2>
                    </div>
                </div>
            )}

            {isDeleting && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem', minWidth: '350px' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid rgba(239, 68, 68, 0.2)', // red-500
                                borderTop: '4px solid #ef4444',
                                borderRadius: '50%'
                            }}
                        />
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.5' }}
                        >
                            Deleting Permanently...<br />Please wait.
                        </motion.h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecycleBin;
