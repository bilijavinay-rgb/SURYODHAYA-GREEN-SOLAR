import React, { useState, useEffect } from 'react';
import { getInvoices, formatCurrency, moveToRecycleBin, updateInvoiceStatus } from '../utils/helpers';
import { format } from 'date-fns';
import { Eye, Printer, Trash2, Edit, X, Loader2, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvoicePreview from './InvoicePreview';
import AlertModal from './AlertModal';
import ExportModal from './ExportModal';
import { useReactToPrint } from 'react-to-print';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { isSameDay, getMonth, getYear } from 'date-fns';
import html2pdf from 'html2pdf.js';

const InvoiceHistory = ({ onViewInvoice }) => {
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [previewInvoiceModal, setPreviewInvoiceModal] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, invoice: null });
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(new Set());
    const [isBulkPrinting, setIsBulkPrinting] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Advanced Filters
    const [filterDate, setFilterDate] = useState(null);
    const [filterMonth, setFilterMonth] = useState(""); // "" = All
    const [filterYear, setFilterYear] = useState(""); // "" = All

    const printRef = React.useRef();
    const bulkPrintRef = React.useRef();

    useEffect(() => {
        // Load invoices from Firestore on component mount
        const fetchInvoices = async () => {
            setIsLoading(true);
            const data = await getInvoices();
            setInvoices(data);
            setIsLoading(false);
        };
        fetchInvoices();
    }, []);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedInvoice ? `Invoice_${selectedInvoice.invoiceNo}` : 'Invoice',
        onAfterPrint: () => setSelectedInvoice(null)
    });

    const handleBulkPrint = useReactToPrint({
        contentRef: bulkPrintRef,
        documentTitle: 'Bulk_Invoices',
    });

    const triggerBulkPrint = () => {
        setIsBulkPrinting(true);
        setTimeout(() => {
            handleBulkPrint();
            setIsBulkPrinting(false);
        }, 500); // Give it time to render the hidden container
    };

    const printInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    const downloadInvoice = (invoice) => {
        const element = document.createElement('div');
        // We need to render the InvoicePreview into this element
        // But html2pdf takes a DOM element.
        // We'll use the printRef approach but with html2pdf settings.
        setSelectedInvoice(invoice);

        setTimeout(() => {
            const opt = {
                margin: 0,
                filename: `Invoice_${invoice.invoiceNo}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: {
                    scale: 3,
                    useCORS: true,
                    letterRendering: true,
                    logging: false,
                    windowWidth: 1050,
                    scrollX: 0,
                    scrollY: 0,
                    x: 0,
                    y: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak: { mode: 'avoid-all' }
            };

            html2pdf().from(printRef.current).set(opt).save().then(() => {
                setSelectedInvoice(null);
            });
        }, 100);
    };

    const confirmDelete = async () => {
        if (!deleteAlert.invoice) return;

        setDeleteAlert({ isOpen: false, invoice: null });
        setIsDeleting(true);

        const success = await moveToRecycleBin(deleteAlert.invoice);

        // Add minimal artificial delay for the animation to be visible
        await new Promise(resolve => setTimeout(resolve, 800));

        if (success) {
            setInvoices((prev) => prev.filter((inv) => inv.invoiceNo !== deleteAlert.invoice.invoiceNo));
        } else {
            alert("Failed to move invoice to recycle bin."); // Keep simple generic alert for actual db fail
        }
        setIsDeleting(false);
    };

    const handleDeleteClick = (invoice, e) => {
        e.stopPropagation();
        setDeleteAlert({ isOpen: true, invoice });
    };

    const triggerBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedInvoiceIds.size} invoices?`)) return;
        setIsBulkDeleting(true);
        const selectedArr = invoices.filter(inv => selectedInvoiceIds.has(inv.invoiceNo));
        
        let successCount = 0;
        await Promise.all(selectedArr.map(async (inv) => {
            const success = await moveToRecycleBin(inv);
            if (success) successCount++;
        }));

        if (successCount > 0) {
            setInvoices(prev => prev.filter(inv => !selectedInvoiceIds.has(inv.invoiceNo)));
            setSelectedInvoiceIds(new Set());
        } else {
            alert("Failed to delete selected invoices.");
        }
        setIsBulkDeleting(false);
    };

    // Filter logic
    const filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);

        // 1. Search Term Check
        const term = searchTerm.toLowerCase();
        const clientNameMatch = invoice.buyer?.name?.toLowerCase().includes(term);
        const invoiceNoMatch = invoice.invoiceNo?.toLowerCase().includes(term);
        const mobileMatch = invoice.buyer?.mobile?.toLowerCase().includes(term);
        const pmsgMatch = invoice.buyer?.pmsgNo?.toLowerCase().includes(term);
        const searchMatch = !searchTerm || clientNameMatch || invoiceNoMatch || mobileMatch || pmsgMatch;

        // 2. Date Filter Check (Exact Day)
        const dateMatch = !filterDate || isSameDay(invoiceDate, filterDate);

        // 3. Month Filter Check
        const monthMatch = filterMonth === "" || getMonth(invoiceDate) === parseInt(filterMonth);

        // 4. Year Filter Check
        const yearMatch = filterYear === "" || getYear(invoiceDate) === parseInt(filterYear);

        return searchMatch && dateMatch && monthMatch && yearMatch;
    });

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDate, filterMonth, filterYear]);

    // Pagination logic
    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const resetFilters = () => {
        setSearchTerm("");
        setFilterDate(null);
        setFilterMonth("");
        setFilterYear("");
    };

    const handleSelectPage = (e) => {
        const newSet = new Set(selectedInvoiceIds);
        if (e.target.checked) {
            paginatedInvoices.forEach(inv => newSet.add(inv.invoiceNo));
        } else {
            paginatedInvoices.forEach(inv => newSet.delete(inv.invoiceNo));
        }
        setSelectedInvoiceIds(newSet);
    };

    const handleSelectAllFiltered = () => {
        setSelectedInvoiceIds(new Set(filteredInvoices.map(inv => inv.invoiceNo)));
    };

    const isCurrentPageSelected = paginatedInvoices.length > 0 && paginatedInvoices.every(inv => selectedInvoiceIds.has(inv.invoiceNo));

    const handleSelectInvoice = (invoiceNo) => {
        const newSelected = new Set(selectedInvoiceIds);
        if (newSelected.has(invoiceNo)) {
            newSelected.delete(invoiceNo);
        } else {
            newSelected.add(invoiceNo);
        }
        setSelectedInvoiceIds(newSelected);
    };

    const exportToExcel = () => {
        setIsExportModalOpen(true);
    };

    // Calculate dynamic filters from actual data
    const availableYears = [...new Set(invoices.map(inv => getYear(new Date(inv.date))))].sort((a, b) => b - a);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="history-container" style={{ paddingBottom: '6rem' }}>
            <div className="header-actions" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Invoice History</h2>
                    <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                        {invoices.length} Total
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <button 
                        onClick={exportToExcel} 
                        className="btn" 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            height: '42px',
                            backgroundColor: '#107c41',
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        <FileDown size={18} /> Export to Excel
                    </button>
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

            {/* Advanced Filter Controls */}
            <div className="card filters-card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'flex-end'
                }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Filter by Day</label>
                        <DatePicker
                            selected={filterDate}
                            onChange={(date) => setFilterDate(date)}
                            placeholderText="Select Date"
                            className="form-control"
                            isClearable
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Filter by Month</label>
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            style={{ height: '42px', backgroundColor: 'white' }}
                        >
                            <option value="">All Months</option>
                            {months.map((name, index) => (
                                <option key={name} value={index}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Filter by Year</label>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            style={{ height: '42px', backgroundColor: 'white' }}
                        >
                            <option value="">All Years</option>
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={resetFilters}
                            style={{ height: '42px', width: '100%', justifyContent: 'center' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    {/* Using the global spinner CSS class created earlier */}
                    <div className="app-spinner" style={{ marginBottom: '1rem' }}></div>
                    <p style={{ fontSize: '1.1rem' }}>Fetching secure invoice history...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="empty-state">
                    <p>No invoices found. Create a new invoice to see it here.</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="empty-state">
                    <p>No results found for "{searchTerm}".</p>
                </div>
            ) : (
                <>
                    <div className="table-responsive card" style={{ padding: 0 }}>
                        <table className="history-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isCurrentPageSelected}
                                        onChange={handleSelectPage}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                </th>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Client Name</th>
                                <th>Total Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInvoices.map((invoice, index) => (
                                <tr key={invoice.invoiceNo || index} style={{ backgroundColor: selectedInvoiceIds.has(invoice.invoiceNo) ? '#f0fdf4' : 'transparent' }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedInvoiceIds.has(invoice.invoiceNo)}
                                            onChange={() => handleSelectInvoice(invoice.invoiceNo)}
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td className="font-medium text-primary">{invoice.invoiceNo}</td>
                                    <td>{format(new Date(invoice.date), 'dd MMM yyyy')}</td>
                                    <td>{invoice.buyer?.name || 'N/A'}</td>
                                    <td className="font-bold">
                                        {/* Calculate total on the fly if needed, or assume it's saved. We'll recalculate here simply by summing items if total isn't saved */}
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
                                                title="Edit"
                                                onClick={() => onViewInvoice(invoice)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Direct Download PDF"
                                                onClick={() => downloadInvoice(invoice)}
                                                style={{ color: 'var(--primary)' }}
                                            >
                                                <FileDown size={16} />
                                            </button>
                                            <button
                                                className="btn-icon hide-on-mobile"
                                                title="Print (PC Only)"
                                                onClick={() => printInvoice(invoice)}
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                className="btn-icon btn-danger"
                                                title="Delete"
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
                
                {totalPages > 1 && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '1.5rem 0 0.5rem 0', 
                        flexWrap: 'wrap', 
                        gap: '1rem' 
                    }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Showing <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{startIndex + 1}</span> to <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{Math.min(startIndex + ITEMS_PER_PAGE, filteredInvoices.length)}</span> of <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{filteredInvoices.length}</span> entries
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                                className="btn" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                style={{ 
                                    padding: '0.4rem 0.8rem', 
                                    fontSize: '0.9rem', 
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    backgroundColor: 'white',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border-color)',
                                    minHeight: 'auto'
                                }}
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.9rem',
                                        fontWeight: currentPage === page ? 600 : 400,
                                        backgroundColor: currentPage === page ? 'var(--primary)' : 'white',
                                        color: currentPage === page ? 'white' : 'var(--text-main)',
                                        border: currentPage === page ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        minWidth: '36px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: 'auto',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button 
                                className="btn" 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                style={{ 
                                    padding: '0.4rem 0.8rem', 
                                    fontSize: '0.9rem', 
                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    backgroundColor: 'white',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border-color)',
                                    minHeight: 'auto'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </>
            )}

            {/* Hidden container for printing */}
            <div className="print-only" style={{ display: 'none' }}>
                {selectedInvoice && (
                    <div ref={printRef}>
                        <InvoicePreview data={selectedInvoice} />
                    </div>
                )}
            </div>

            <AlertModal
                isOpen={deleteAlert.isOpen}
                title="Delete Invoice"
                message={`Are you sure you want to move Invoice ${deleteAlert.invoice?.invoiceNo || ''} to the Recycle Bin?`}
                type="warning"
                confirmText="Delete"
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

            {isDeleting && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem', minWidth: '350px' }}>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            style={{
                                width: '60px',
                                height: '60px',
                                border: '4px solid rgba(239, 68, 68, 0.2)', // red-500 equivalent
                                borderTop: '4px solid #ef4444',
                                borderRadius: '50%'
                            }}
                        />
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.5' }}
                        >
                            Moving to Recycle Bin...<br />Please wait.
                        </motion.h2>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedInvoiceIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            backgroundColor: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '50px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            zIndex: 100,
                            border: '1px solid var(--border-color)',
                            minWidth: 'max-content'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                                {selectedInvoiceIds.size}
                            </div>
                            <span style={{ fontSize: '0.95rem' }}>Invoices Selected</span>
                        </div>
                        
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {isCurrentPageSelected && selectedInvoiceIds.size < filteredInvoices.length && (
                                <button 
                                    onClick={handleSelectAllFiltered}
                                    style={{ background: 'transparent', border: 'none', color: '#107c41', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '20px', transition: 'background-color 0.2s', textDecoration: 'underline' }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#f0fdf4'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    Select all {filteredInvoices.length}
                                </button>
                            )}
                            <button 
                                onClick={triggerBulkPrint}
                                disabled={isBulkPrinting}
                                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                {isBulkPrinting ? <Loader2 size={16} className="spin" /> : <Printer size={16} />} Print
                            </button>
                            <button 
                                onClick={triggerBulkDelete}
                                disabled={isBulkDeleting}
                                style={{ background: 'transparent', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                {isBulkDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />} Delete
                            </button>
                            <button 
                                onClick={() => setSelectedInvoiceIds(new Set())}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '20px', transition: 'background-color 0.2s' }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                Clear
                            </button>
                            <button 
                                onClick={exportToExcel}
                                className="btn"
                                style={{ backgroundColor: '#107c41', color: 'white', border: 'none', borderRadius: '20px', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                            >
                                <FileDown size={16} /> Export Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ExportModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                allInvoices={invoices}
                filteredInvoices={filteredInvoices}
                selectedInvoices={invoices.filter(inv => selectedInvoiceIds.has(inv.invoiceNo))}
            />

            {/* Hidden container for Bulk printing */}
            <div style={{ display: 'none' }}>
                <div ref={bulkPrintRef}>
                    {invoices.filter(inv => selectedInvoiceIds.has(inv.invoiceNo)).map((inv, index, arr) => (
                        <div key={inv.invoiceNo} style={{ pageBreakAfter: index === arr.length - 1 ? 'auto' : 'always' }}>
                            <InvoicePreview data={inv} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InvoiceHistory;
