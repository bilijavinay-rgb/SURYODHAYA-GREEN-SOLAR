import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, Loader2, CheckCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { generateExportFile } from '../utils/exportHelpers';

const ExportModal = ({ isOpen, onClose, allInvoices, filteredInvoices, selectedInvoices }) => {
    const [exportFormat, setExportFormat] = useState('xlsx');
    const [exportType, setExportType] = useState('filtered');
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset states when modal opens
            setExportSuccess(false);
            setIsExporting(false);
            if (selectedInvoices?.length > 0) {
                setExportType('selected');
            } else {
                setExportType('filtered');
            }
        }
    }, [isOpen, selectedInvoices]);

    if (!isOpen) return null;

    let targetInvoices = [];
    if (exportType === 'all') targetInvoices = allInvoices;
    else if (exportType === 'filtered') targetInvoices = filteredInvoices;
    else if (exportType === 'selected') targetInvoices = selectedInvoices;

    const invoiceCount = targetInvoices?.length || 0;
    
    // Roughly estimate 1.5kb per invoice row for XLSX
    const estimatedSizeKB = Math.round((invoiceCount * 1.5) + 10); 
    const sizeDisplay = estimatedSizeKB > 1024 
        ? `${(estimatedSizeKB / 1024).toFixed(2)} MB` 
        : `${estimatedSizeKB} KB`;

    const handleExport = async () => {
        if (invoiceCount === 0) return;
        setIsExporting(true);
        setExportSuccess(false);

        try {
            // Artificial delay to show the nice progress UI
            await new Promise(res => setTimeout(res, 1200));
            
            await generateExportFile(targetInvoices, exportFormat);
            
            setIsExporting(false);
            setExportSuccess(true);
            
            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Export failed:", error);
            setIsExporting(false);
            alert("Failed to export invoices. Check console for details.");
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="card"
                style={{ width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden' }}
            >
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.5rem', borderRadius: '8px' }}>
                            <FileDown size={24} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Export Invoices</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon" disabled={isExporting}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Export Type</label>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input 
                                    type="radio" 
                                    name="exportType" 
                                    value="filtered"
                                    checked={exportType === 'filtered'}
                                    onChange={(e) => setExportType(e.target.value)}
                                    disabled={isExporting}
                                />
                                <span>Filtered Records ({filteredInvoices?.length || 0})</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input 
                                    type="radio" 
                                    name="exportType" 
                                    value="all"
                                    checked={exportType === 'all'}
                                    onChange={(e) => setExportType(e.target.value)}
                                    disabled={isExporting}
                                />
                                <span>All Records ({allInvoices?.length || 0})</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: selectedInvoices?.length ? 'pointer' : 'not-allowed', opacity: selectedInvoices?.length ? 1 : 0.5 }}>
                                <input 
                                    type="radio" 
                                    name="exportType" 
                                    value="selected"
                                    checked={exportType === 'selected'}
                                    onChange={(e) => setExportType(e.target.value)}
                                    disabled={isExporting || !selectedInvoices?.length}
                                />
                                <span>Selected Records ({selectedInvoices?.length || 0})</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Export Format</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div 
                                onClick={() => !isExporting && setExportFormat('xlsx')}
                                style={{ 
                                    border: `2px solid ${exportFormat === 'xlsx' ? '#107c41' : 'var(--border-color)'}`,
                                    backgroundColor: exportFormat === 'xlsx' ? '#f0fdf4' : 'transparent',
                                    padding: '1rem', 
                                    borderRadius: '8px', 
                                    cursor: isExporting ? 'default' : 'pointer',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.75rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <FileSpreadsheet size={24} color="#107c41" />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Excel</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>.xlsx format</div>
                                </div>
                            </div>
                            <div 
                                onClick={() => !isExporting && setExportFormat('csv')}
                                style={{ 
                                    border: `2px solid ${exportFormat === 'csv' ? 'var(--primary)' : 'var(--border-color)'}`,
                                    backgroundColor: exportFormat === 'csv' ? '#eff6ff' : 'transparent',
                                    padding: '1rem', 
                                    borderRadius: '8px', 
                                    cursor: isExporting ? 'default' : 'pointer',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.75rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <FileText size={24} color="var(--primary)" />
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>CSV</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Plain text</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Invoices to Export: <strong>{invoiceCount}</strong></span>
                        <span>Est. Size: <strong>{sizeDisplay}</strong></span>
                    </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn btn-secondary" disabled={isExporting}>
                        Cancel
                    </button>
                    <button 
                        onClick={handleExport} 
                        className="btn" 
                        disabled={invoiceCount === 0 || isExporting || exportSuccess}
                        style={{ 
                            backgroundColor: exportSuccess ? '#16a34a' : exportFormat === 'xlsx' ? '#107c41' : 'var(--primary)', 
                            color: 'white',
                            border: 'none',
                            minWidth: '140px',
                            justifyContent: 'center'
                        }}
                    >
                        {isExporting ? (
                            <><Loader2 size={18} className="animate-spin" /> Exporting...</>
                        ) : exportSuccess ? (
                            <><CheckCircle size={18} /> Done!</>
                        ) : (
                            <><FileDown size={18} /> Download Now</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ExportModal;
