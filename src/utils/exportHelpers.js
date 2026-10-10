import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export const generateExportFile = async (invoices, exportFormat) => {
    // 1. Flatten the invoice data
    const flattenedData = invoices.map(invoice => {
        const dateStr = invoice.date ? format(new Date(invoice.date), 'dd MMM yyyy') : 'N/A';
        const poDateStr = invoice.poDate ? format(new Date(invoice.poDate), 'dd MMM yyyy') : 'N/A';
        
        let subtotal = 0;
        let totalGst = 0;
        
        // Items string formatting
        const itemsStr = invoice.items?.map(item => {
            const amount = item.qty * item.rate;
            const tax = (amount * item.gstRate) / 100;
            subtotal += amount;
            totalGst += tax;
            return `${item.description} (Qty: ${item.qty}, Rate: ${item.rate}, GST: ${item.gstRate}%)`;
        }).join('\n') || '';

        const grandTotal = subtotal + totalGst;

        return {
            'Invoice No': invoice.invoiceNo,
            'Date': dateStr,
            'PMSG App No': invoice.buyer?.pmsgNo || 'N/A',
            'Client Name': invoice.buyer?.name?.split(',')[0] || 'N/A',
            'Client Address': invoice.buyer?.address?.replace(/\n/g, ' ') || 'N/A',
            'Client GSTIN': invoice.buyer?.gstin || 'N/A',
            'Client State': invoice.buyer?.state || 'N/A',
            'PO No': invoice.poNo || 'N/A',
            'PO Date': poDateStr,
            'Destination': invoice.destination || 'N/A',
            'Items Summary': itemsStr,
            'Subtotal': Number(subtotal.toFixed(2)),
            'Total GST': Number(totalGst.toFixed(2)),
            'Grand Total': Math.round(grandTotal)
        };
    });

    if (exportFormat === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Suryodhaya Green Solar';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Invoices');

        // Define columns
        worksheet.columns = [
            { header: 'Invoice No', key: 'Invoice No', width: 15 },
            { header: 'Date', key: 'Date', width: 15 },
            { header: 'PMSG App No', key: 'PMSG App No', width: 20 },
            { header: 'Client Name', key: 'Client Name', width: 25 },
            { header: 'Client Address', key: 'Client Address', width: 35 },
            { header: 'Client GSTIN', key: 'Client GSTIN', width: 20 },
            { header: 'Client State', key: 'Client State', width: 20 },
            { header: 'PO No', key: 'PO No', width: 15 },
            { header: 'PO Date', key: 'PO Date', width: 15 },
            { header: 'Destination', key: 'Destination', width: 20 },
            { header: 'Items Summary', key: 'Items Summary', width: 45 },
            { header: 'Subtotal', key: 'Subtotal', width: 15 },
            { header: 'Total GST', key: 'Total GST', width: 15 },
            { header: 'Grand Total', key: 'Grand Total', width: 15 }
        ];

        // Add rows
        worksheet.addRows(flattenedData);

        // Styling the header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF107C41' } // Excel Green
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Formatting currency columns
        ['Subtotal', 'Total GST', 'Grand Total'].forEach(key => {
            const col = worksheet.getColumn(key);
            col.numFmt = '"₹"#,##0.00';
            col.alignment = { horizontal: 'right' };
        });

        // Add borders and wrap text for items
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.border = {
                    top: {style:'thin'},
                    left: {style:'thin'},
                    bottom: {style:'thin'},
                    right: {style:'thin'}
                };
                if (rowNumber > 1) {
                    cell.alignment = { vertical: 'top', wrapText: true };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Invoices_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);

    } else if (exportFormat === 'csv') {
        if (flattenedData.length === 0) return;
        
        const headers = Object.keys(flattenedData[0]);
        const csvRows = [
            headers.join(','),
            ...flattenedData.map(row => 
                headers.map(header => {
                    let val = row[header];
                    // Escape quotes and wrap in quotes if contains comma or newline
                    if (typeof val === 'string') {
                        val = val.replace(/"/g, '""');
                        if (val.includes(',') || val.includes('\n')) {
                            val = `"${val}"`;
                        }
                    }
                    return val;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `Invoices_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    }
};
