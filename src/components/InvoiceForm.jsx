import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Building2, Receipt, CreditCard, Calendar, Eye, AlertTriangle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { findInvoiceByPmsgNo } from '../utils/helpers';

const InvoiceForm = ({ data, setData, onViewInvoice }) => {
    const [duplicateInvoice, setDuplicateInvoice] = useState(null);

    const pmsgVal = data.pmsgNo || data.buyer?.pmsgNo || '';

    useEffect(() => {
        let isMounted = true;
        const checkDuplicate = async () => {
            if (!pmsgVal) {
                if (isMounted) setDuplicateInvoice(null);
                return;
            }
            const found = await findInvoiceByPmsgNo(pmsgVal);
            if (isMounted) {
                if (found && found.invoiceNo !== data.invoiceNo) {
                    setDuplicateInvoice(found);
                } else {
                    setDuplicateInvoice(null);
                }
            }
        };
        const timer = setTimeout(checkDuplicate, 400);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [pmsgVal, data.invoiceNo]);

    const handleChange = (e, section, field) => {
        const value = e.target ? e.target.value : e; // Handle both event and direct value (for DatePicker)
        if (section) {
            setData(prev => ({
                ...prev,
                [section]: { ...prev[section], [field]: value }
            }));
        } else {
            setData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleDateChange = (date, field) => {
        setData(prev => ({ ...prev, [field]: date }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { description: '', hsn: '', gstRate: 18, qty: 1, rate: 0, unit: 'Nos' }
            ]
        }));
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData(prev => ({ ...prev, items: newItems }));
    };

    const getPmsgNumericPart = (val) => {
        if (!val) return '';
        return val.replace(/^NP-APSPD-/, '');
    };

    const handlePmsgChange = (val) => {
        const numeric = val.replace(/^NP-APSPD-/, '').trim();
        const fullNo = numeric ? `NP-APSPD-${numeric}` : '';
        setData(prev => ({
            ...prev,
            pmsgNo: fullNo,
            buyer: { ...prev.buyer, pmsgNo: fullNo }
        }));
    };

    return (
        <div className="invoice-form">
            <div className="form-section">
                <h3 className="section-title"><Receipt size={20} /> Invoice Details</h3>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Invoice No</label>
                        <input type="text" value={data.invoiceNo} onChange={(e) => handleChange(e, null, 'invoiceNo')} />
                    </div>
                    <div className="input-group">
                        <label>Date</label>
                        <div className="datepicker-wrapper">
                            <DatePicker
                                selected={data.date ? new Date(data.date) : null}
                                onChange={(date) => handleDateChange(date, 'date')}
                                dateFormat="dd-MMM-yyyy"
                                className="custom-datepicker"
                            />
                            <Calendar className="datepicker-icon" size={16} />
                        </div>
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Buyer PO No</label>
                        <input type="text" value={data.poNo} onChange={(e) => handleChange(e, null, 'poNo')} />
                    </div>
                    <div className="input-group">
                        <label>PO Date</label>
                        <div className="datepicker-wrapper">
                            <DatePicker
                                selected={data.poDate ? new Date(data.poDate) : null}
                                onChange={(date) => handleDateChange(date, 'poDate')}
                                dateFormat="dd-MMM-yyyy"
                                className="custom-datepicker"
                                isClearable
                                placeholderText="Select PO Date"
                            />
                            <Calendar className="datepicker-icon" size={16} />
                        </div>
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Delivery Note</label>
                        <input type="text" value={data.deliveryNote} onChange={(e) => handleChange(e, null, 'deliveryNote')} />
                    </div>
                    <div className="input-group">
                        <label>Mode/Terms of Payment</label>
                        <input type="text" value={data.paymentTerms} onChange={(e) => handleChange(e, null, 'paymentTerms')} />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Despatch through</label>
                        <input type="text" value={data.despatchThrough} onChange={(e) => handleChange(e, null, 'despatchThrough')} />
                    </div>
                    <div className="input-group">
                        <label>Destination</label>
                        <input type="text" value={data.destination} onChange={(e) => handleChange(e, null, 'destination')} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title"><User size={20} /> Buyer Details</h3>
                <div className="input-group">
                    <label>PMSG Application Number</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                            padding: '0.6rem 0.8rem',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid var(--border-color)',
                            borderRight: 'none',
                            borderRadius: '8px 0 0 8px',
                            fontWeight: '600',
                            color: 'var(--primary)',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            userSelect: 'none'
                        }}>
                            NP-APSPD-
                        </span>
                        <input
                            type="text"
                            style={{ borderRadius: '0 8px 8px 0', flex: 1 }}
                            value={getPmsgNumericPart(data.pmsgNo || data.buyer?.pmsgNo)}
                            onChange={(e) => handlePmsgChange(e.target.value)}
                            placeholder="XXXXXXXX"
                        />
                    </div>
                    {duplicateInvoice && (
                        <div style={{
                            marginTop: '0.6rem',
                            padding: '0.85rem 1rem',
                            backgroundColor: '#fffbebfb',
                            border: '1px solid #fde68a',
                            borderLeft: '4px solid #f59e0b',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 600, fontSize: '0.9rem' }}>
                                <AlertTriangle size={18} color="#d97706" />
                                <span>Invoice already created for this Application Number!</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: '1.4' }}>
                                Invoice <strong>#{duplicateInvoice.invoiceNo}</strong> was previously created for <strong>{duplicateInvoice.buyer?.name || 'Customer'}</strong>.
                            </div>
                            <div>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => onViewInvoice && onViewInvoice(duplicateInvoice)}
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.45rem 0.9rem',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        marginTop: '0.2rem'
                                    }}
                                >
                                    <Eye size={16} /> View / Edit Invoice ({duplicateInvoice.invoiceNo})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="input-group">
                    <label>Name</label>
                    <input type="text" value={data.buyer.name} onChange={(e) => handleChange(e, 'buyer', 'name')} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Mobile Number</label>
                        <input type="text" value={data.buyer.mobile || ''} onChange={(e) => handleChange(e, 'buyer', 'mobile')} />
                    </div>
                </div>
                <div className="input-group">
                    <label>Address</label>
                    <textarea value={data.buyer.address} onChange={(e) => handleChange(e, 'buyer', 'address')} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>State</label>
                        <input type="text" value={data.buyer.state} onChange={(e) => handleChange(e, 'buyer', 'state')} />
                    </div>
                    <div className="input-group">
                        <label>State Code</label>
                        <input type="text" value={data.buyer.stateCode} onChange={(e) => handleChange(e, 'buyer', 'stateCode')} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title"><Building2 size={20} /> Consignee Details</h3>
                <div className="input-group">
                    <label>Name</label>
                    <input type="text" value={data.consignee.name} onChange={(e) => handleChange(e, 'consignee', 'name')} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Mobile Number</label>
                        <input type="text" value={data.consignee.mobile || ''} onChange={(e) => handleChange(e, 'consignee', 'mobile')} />
                    </div>
                </div>
                <div className="input-group">
                    <label>Address</label>
                    <textarea value={data.consignee.address} onChange={(e) => handleChange(e, 'consignee', 'address')} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>State</label>
                        <input type="text" value={data.consignee.state} onChange={(e) => handleChange(e, 'consignee', 'state')} />
                    </div>
                    <div className="input-group">
                        <label>State Code</label>
                        <input type="text" value={data.consignee.stateCode} onChange={(e) => handleChange(e, 'consignee', 'stateCode')} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title"><Receipt size={20} /> Items</h3>
                {data.items.map((item, index) => (
                    <div key={index} className="item-row">
                        <div className="grid-item-main">
                            <input
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                            <div className="grid-sub">
                                <input placeholder="HSN" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />
                                <input type="number" placeholder="GST %" value={item.gstRate} onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))} />
                                <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value))} />
                                <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))} />
                                <input placeholder="Unit" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} />
                            </div>
                        </div>
                        <button className="btn-icon btn-danger" onClick={() => removeItem(index)}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <button className="btn btn-primary" onClick={addItem}>
                    <Plus size={16} /> Add Item
                </button>
            </div>

            <div className="form-section">
                <h3 className="section-title"><CreditCard size={20} /> Bank & ID Details</h3>
                <div className="input-group">
                    <label>Enterprise Name</label>
                    <input type="text" value={data.bankDetails.name} onChange={(e) => handleChange(e, 'bankDetails', 'name')} />
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>Bank Name</label>
                        <input type="text" value={data.bankDetails.bankName} onChange={(e) => handleChange(e, 'bankDetails', 'bankName')} />
                    </div>
                    <div className="input-group">
                        <label>Account No</label>
                        <input type="text" value={data.bankDetails.accountNo} onChange={(e) => handleChange(e, 'bankDetails', 'accountNo')} />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>IFSC Code</label>
                        <input type="text" value={data.bankDetails.ifscCode} onChange={(e) => handleChange(e, 'bankDetails', 'ifscCode')} />
                    </div>
                    <div className="input-group">
                        <label>Branch</label>
                        <input type="text" value={data.bankDetails.branch} onChange={(e) => handleChange(e, 'bankDetails', 'branch')} />
                    </div>
                </div>
                <div className="grid-2">
                    <div className="input-group">
                        <label>PAN</label>
                        <input type="text" value={data.pan} onChange={(e) => handleChange(e, null, 'pan')} />
                    </div>
                    <div className="input-group">
                        <label>GSTIN</label>
                        <input type="text" value={data.gstin} onChange={(e) => handleChange(e, null, 'gstin')} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title"><Receipt size={20} /> Additional Note</h3>
                <div className="input-group">
                    <label>Invoice Note/Disclaimer</label>
                    <textarea
                        value={data.note}
                        onChange={(e) => handleChange(e, null, 'note')}
                        style={{ minHeight: '120px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
