import React, { forwardRef } from 'react';
import { calculateTotals, formatCurrency, numberToWords } from '../utils/helpers';
import { format } from 'date-fns';

const formatInvoiceDate = (date) => {
    if (!date) return '';
    return format(date, 'dd-MMM').toUpperCase() + ' -' + format(date, 'yyyy');
};

const formatPmsgNo = (val) => {
    if (!val) return 'NP-APSPD-XXXXXXXX';
    if (val.startsWith('NP-APSPD-')) return val;
    return `NP-APSPD-${val}`;
};

const InvoicePreview = forwardRef(({ data }, ref) => {
    const { subTotal, hsnSummary, totalGst, grandTotal } = calculateTotals(data.items);

    return (
        <div ref={ref} className="invoice-preview-container" style={{ padding: '29mm 10mm 5mm 10mm', maxHeight: '296mm', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div className="invoice-header" style={{ display: 'flex', flexDirection: 'column', padding: 0, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '80px', padding: '4px' }}>
                    <img src="/logo.png" alt="Logo" style={{ position: 'absolute', left: '4px', top: '4px', height: '80px', width: 'auto' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '4px' }}>SURYODHAYA GREEN SOLAR</span>
                        <div style={{ textAlign: 'center', fontSize: '0.8em', marginBottom: '4px', lineHeight: '1.2' }}>
                            #11-35, KOTLOPALLI (V), Chilamathur (M),<br />
                            SRI SATYA SAI (D), ANDHRA PRADESH (S) PIN-515601
                        </div>
                    </div>
                    <div style={{ position: 'absolute', right: '10px', top: '10px', textAlign: 'right', fontSize: '0.8em', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Prop : D.Gowthami</div>
                        <div style={{ fontWeight: 'bold' }}>Contact No : 6305256408,<br />9701864622</div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #000', padding: '4px', textAlign: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 'bold' }}>TAX INVOICE</span>
                </div>
            </div>

            <table className="invoice-table" style={{ borderTop: 'none' }}>
                <tbody>
                    <tr>
                        <td colSpan="4" style={{ width: '50%', verticalAlign: 'top', borderRight: '1px solid #000' }}>
                            <div style={{ fontWeight: 'bold' }}>INVOICE NO: {data.invoiceNo}</div>
                            <div style={{ fontWeight: 'bold' }}>DATED:{formatInvoiceDate(data.date)}</div>
                        </td>
                        <td colSpan="2" style={{ width: '25%', verticalAlign: 'top', borderRight: '1px solid #000' }}>
                            <div style={{ fontWeight: 'bold' }}>Buyer PO No</div>
                            <div style={{ minHeight: '1.2em' }}>{data.poNo}</div>
                        </td>
                        <td colSpan="2" style={{ width: '25%', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', textAlign: 'center' }}>DATED</div>
                            <div style={{ minHeight: '1.2em', textAlign: 'center' }}>{formatInvoiceDate(data.poDate)}</div>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="4" style={{ verticalAlign: 'top', borderRight: '1px solid #000', padding: '4px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.85em', whiteSpace: 'nowrap' }}>
                                PMSG APPLICATION NO : {formatPmsgNo(data.pmsgNo || data.buyer?.pmsgNo)}
                            </div>
                        </td>
                        <td colSpan="2" style={{ verticalAlign: 'top', borderRight: '1px solid #000' }}>
                            <div style={{ fontWeight: 'bold' }}>Delivery Note</div>
                            <div style={{ minHeight: '1.2em' }}>{data.deliveryNote}</div>
                        </td>
                        <td colSpan="2" style={{ verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold' }}>Mode/Terms of Payment</div>
                            <div style={{ minHeight: '1.2em' }}>{data.paymentTerms}</div>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="4" style={{ verticalAlign: 'top', borderRight: '1px solid #000', padding: '4px' }}>
                            <div style={{ fontWeight: 'bold' }}>Buyer (Bill to )</div>
                            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>{data.buyer?.name}</div>
                            {data.buyer?.mobile && <div style={{ fontWeight: 'bold' }}>Mobile: {data.buyer.mobile}</div>}
                            <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{data.buyer?.address}</div>
                            <div style={{ marginTop: '2px', fontWeight: 'bold' }}>STATE NAME: {data.buyer?.state}, CODE: {data.buyer?.stateCode}</div>
                        </td>
                        <td colSpan="4" style={{ verticalAlign: 'top', padding: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000' }}>
                                <div style={{ borderRight: '1px solid #000', padding: '2px 4px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Despatch through</div>
                                    <div style={{ fontWeight: 'bold' }}>{data.despatchThrough}</div>
                                </div>
                                <div style={{ padding: '2px 4px' }}>
                                    <div style={{ fontWeight: 'bold' }}>Destination</div>
                                    <div style={{ fontWeight: 'bold' }}>{data.destination}</div>
                                </div>
                            </div>
                            <div style={{ padding: '4px' }}>
                                <div style={{ fontWeight: 'bold' }}>Consignee:</div>
                                <div style={{ fontWeight: 'bold' }}>{data.consignee?.name}</div>
                                {data.consignee?.mobile && <div style={{ fontWeight: 'bold' }}>Mobile: {data.consignee.mobile}</div>}
                                <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{data.consignee?.address}</div>
                                <div style={{ marginTop: '2px', fontWeight: 'bold' }}>STATE NAME: {data.consignee?.state}, CODE: {data.consignee?.stateCode}</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="invoice-table" style={{ borderTop: 'none' }}>
                <thead>
                    <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>OS.No</th>
                        <th style={{ width: '300px', textAlign: 'center' }}>Description Of Goods</th>
                        <th style={{ textAlign: 'center', width: '60px' }}>HSN/SA C</th>
                        <th style={{ textAlign: 'center', width: '40px' }}>GST</th>
                        <th style={{ textAlign: 'center', width: '40px' }}>Qty</th>
                        <th style={{ textAlign: 'center', width: '80px' }}>Rate</th>
                        <th style={{ textAlign: 'center', width: '40px' }}>Unit</th>
                        <th style={{ textAlign: 'center', width: '100px' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index} style={{ height: '30px', verticalAlign: 'top' }}>
                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ padding: '4px 8px' }}>
                                <div style={{ fontWeight: 'bold' }}>{item.description}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.hsn}</td>
                            <td style={{ textAlign: 'center' }}>{item.gstRate}%</td>
                            <td style={{ textAlign: 'center' }}>{item.qty.toString().padStart(2, '0')}</td>
                            <td style={{ textAlign: 'right' }}>{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td style={{ textAlign: 'center' }}>{item.unit}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    {/* Fill remaining space without explicitly hardcoding empty strings that cause page breaks */}
                    <tr>
                        <td style={{ borderBottom: 'none' }}></td>
                        <td style={{ verticalAlign: 'top', borderBottom: 'none', paddingBottom: '10px' }}>
                            <div style={{ whiteSpace: 'pre-wrap', marginTop: '10px', minHeight: '60px' }}>{data.note}</div>
                            <div style={{ textAlign: 'right', fontWeight: 'bold', marginTop: '10px', fontSize: '12px' }}>CGST</div>
                            <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>SGST</div>
                        </td>
                        <td style={{ borderBottom: 'none' }}></td>
                        <td style={{ borderBottom: 'none' }}></td>
                        <td style={{ borderBottom: 'none' }}></td>
                        <td style={{ borderBottom: 'none' }}></td>
                        <td style={{ borderBottom: 'none' }}></td>
                        <td style={{ borderBottom: 'none', textAlign: 'right', verticalAlign: 'bottom' }}>
                            <div style={{ borderTop: '1px solid #000', paddingBottom: '4px' }}>{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div style={{ marginBottom: '4px' }}>{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div style={{ borderBottom: '1px solid #000', paddingBottom: '4px' }}>{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div style={{ fontWeight: 'bold', paddingTop: '4px' }}>{formatCurrency(grandTotal).replace('₹', '')}</div>
                        </td>
                    </tr>
                    <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="7" style={{ textAlign: 'center', borderRight: '1px solid #000' }}>Grand Total INR</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(grandTotal)}</td>
                    </tr>
                </tbody>
            </table>

            {/* HSN Summary Table */}
            <table className="invoice-table" style={{ borderTop: 'none' }}>
                <thead>
                    <tr>
                        <th rowSpan="2" style={{ textAlign: 'center' }}>HSN/SAC</th>
                        <th rowSpan="2" style={{ textAlign: 'center' }}>Taxable Value</th>
                        <th colSpan="2" style={{ textAlign: 'center' }}>CGST</th>
                        <th colSpan="2" style={{ textAlign: 'center' }}>SGST/UTGST</th>
                        <th colSpan="2" style={{ textAlign: 'center' }}>State Tax</th>
                        <th rowSpan="2" style={{ textAlign: 'center' }}>Total Tax Amount</th>
                    </tr>
                    <tr>
                        <th style={{ textAlign: 'center' }}>Rate</th>
                        <th style={{ textAlign: 'center' }}>Amount</th>
                        <th style={{ textAlign: 'center' }}>Rate</th>
                        <th style={{ textAlign: 'center' }}>Amount</th>
                        <th style={{ textAlign: 'center' }}>Rate</th>
                        <th style={{ textAlign: 'center' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {hsnSummary.map((hsn, index) => (
                        <tr key={index}>
                            <td style={{ textAlign: 'center' }}>{hsn.hsn}</td>
                            <td style={{ textAlign: 'right' }}>{hsn.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td style={{ textAlign: 'center' }}>{hsn.cgstRate}%</td>
                            <td style={{ textAlign: 'right' }}>{hsn.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td style={{ textAlign: 'center' }}>{hsn.sgstRate}%</td>
                            <td style={{ textAlign: 'right' }}>{hsn.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td></td>
                            <td></td>
                            <td style={{ textAlign: 'right' }}>{hsn.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold' }}>
                        <td>Total</td>
                        <td style={{ textAlign: 'right' }}>{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td colSpan="2" style={{ textAlign: 'right' }}>{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td colSpan="2" style={{ textAlign: 'right' }}>{(totalGst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td colSpan="2"></td>
                        <td style={{ textAlign: 'right' }}>{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ padding: '4px', border: '1px solid #000', borderTop: 'none', fontWeight: 'bold' }}>
                Tax Amount (in Words) (INR) {numberToWords(grandTotal)}.
            </div>

            <div style={{ border: '1px solid #000', borderTop: 'none', padding: '4px' }}>
                We Declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>

            <table className="invoice-table" style={{ borderTop: 'none', marginBottom: 0 }}>
                <tbody>
                    <tr>
                        <td style={{ width: '50%', verticalAlign: 'top', borderRight: '1px solid #000' }}>
                            <div style={{ textAlign: 'center', borderBottom: '1px solid #000', margin: '0 -4px', padding: '2px' }}>PAN: {data.pan}</div>
                            <div style={{ padding: '8px' }}>
                                <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Our Bank Details:-</span><br />
                                <span style={{ fontWeight: 'bold' }}>SURYODHAYA GREEN SOLAR</span><br />
                                {data.bankDetails.bankName}, A/c No:-{data.bankDetails.accountNo}<br />
                                IFSC CODE:{data.bankDetails.ifscCode}, {data.bankDetails.branch}
                            </div>
                        </td>
                        <td style={{ width: '50%', verticalAlign: 'top', padding: '8px', textAlign: 'right' }}>
                            <div style={{ borderBottom: '1px solid #000', margin: ' -8px -4px 0 -4px', padding: '2px', textAlign: 'center' }}>GSTIN: {data.gstin}</div>
                            <div style={{ marginTop: '10px', fontWeight: 'bold', textAlign: 'center' }}>For SURYODHAYA GREEN SOLAR</div>
                            <div style={{ marginTop: '40px', textAlign: 'center', paddingBottom: '5px' }}>
                                <div style={{ fontWeight: 'bold' }}>Authorized Signature</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
});

export default InvoicePreview;
