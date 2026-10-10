import { collection, doc, setDoc, getDocs, deleteDoc, getDoc, query } from 'firebase/firestore';
import { db } from '../firebase';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount).replace('₹', '₹');
};

export const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit !== 0 ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const str = Math.floor(num).toString();
  const words = inWords(parseInt(str));
  return words + 'Rupees Only';
};

export const calculateTotals = (items) => {
  let subTotal = 0;
  const hsnSummary = {};

  items.forEach(item => {
    const amount = item.qty * item.rate;
    subTotal += amount;

    if (!hsnSummary[item.hsn]) {
      hsnSummary[item.hsn] = {
        hsn: item.hsn,
        taxableValue: 0,
        cgstRate: item.gstRate / 2,
        cgstAmount: 0,
        sgstRate: item.gstRate / 2,
        sgstAmount: 0,
        totalTax: 0
      };
    }

    const taxableValue = amount;
    const cgstAmount = (taxableValue * (item.gstRate / 2)) / 100;
    const sgstAmount = (taxableValue * (item.gstRate / 2)) / 100;

    hsnSummary[item.hsn].taxableValue += taxableValue;
    hsnSummary[item.hsn].cgstAmount += cgstAmount;
    hsnSummary[item.hsn].sgstAmount += sgstAmount;
    hsnSummary[item.hsn].totalTax += (cgstAmount + sgstAmount);
  });

  const totalGst = Object.values(hsnSummary).reduce((acc, curr) => acc + curr.totalTax, 0);
  const grandTotal = Math.round(subTotal + totalGst);

  return {
    subTotal,
    hsnSummary: Object.values(hsnSummary),
    totalGst,
    grandTotal
  };
};

export const generateNextInvoiceNumber = async () => {
  try {
    const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
    const recycledSnapshot = await getDocs(collection(db, 'recycled_invoices'));
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `SGS${year}-`;

    let maxSeq = 0;

    const processDoc = (doc) => {
      const data = doc.data();
      if (data.invoiceNo && data.invoiceNo.startsWith(prefix)) {
        const seqStr = data.invoiceNo.substring(prefix.length);
        // Extract just the numeric part at the start of the remaining string
        const match = seqStr.match(/^(\d+)/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    };

    invoicesSnapshot.forEach(processDoc);
    recycledSnapshot.forEach(processDoc);

    const nextSeq = maxSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    // fallback
    const year = new Date().getFullYear().toString().slice(-2);
    const randomSeq = Math.floor(100 + Math.random() * 900);
    return `SGS${year}-${randomSeq}`;
  }
};

export const saveInvoice = async (invoiceData) => {
  try {
    // We use the invoiceNo as the document ID for ease of retrieval and uniqueness
    const invoiceRef = doc(db, 'invoices', invoiceData.invoiceNo);
    await setDoc(invoiceRef, invoiceData);
    return true;
  } catch (error) {
    console.error('Error saving invoice:', error);
    return false;
  }
};

export const updateInvoiceStatus = async (invoiceNo, status) => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceNo);
    await setDoc(invoiceRef, { status }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return false;
  }
};

export const getInvoices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'invoices'));
    const invoices = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamps to ISO Strings
      if (data.date && typeof data.date.toDate === 'function') {
        data.date = data.date.toDate().toISOString();
      } else if (data.date && data.date.seconds) {
        data.date = new Date(data.date.seconds * 1000).toISOString();
      }
      if (data.poDate && typeof data.poDate.toDate === 'function') {
        data.poDate = data.poDate.toDate().toISOString();
      } else if (data.poDate && data.poDate.seconds) {
        data.poDate = new Date(data.poDate.seconds * 1000).toISOString();
      }
      invoices.push(data);
    });
    // Sort strictly by invoiceNo descending to ensure stable order regardless of edits
    invoices.sort((a, b) => {
      if (a.invoiceNo && b.invoiceNo) {
        return b.invoiceNo.localeCompare(a.invoiceNo);
      }
      return 0;
    });
    return invoices;
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
};

export const getInvoiceById = async (invoiceNo) => {
  try {
    const docRef = doc(db, 'invoices', invoiceNo);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.date && typeof data.date.toDate === 'function') {
        data.date = data.date.toDate().toISOString();
      } else if (data.date && data.date.seconds) {
        data.date = new Date(data.date.seconds * 1000).toISOString();
      }
      if (data.poDate && typeof data.poDate.toDate === 'function') {
        data.poDate = data.poDate.toDate().toISOString();
      } else if (data.poDate && data.poDate.seconds) {
        data.poDate = new Date(data.poDate.seconds * 1000).toISOString();
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error getting invoice by id:', error);
    return null;
  }
};

export const deleteInvoice = async (invoiceNo) => {
  try {
    await deleteDoc(doc(db, 'invoices', invoiceNo));
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
};

export const moveToRecycleBin = async (invoiceData) => {
  try {
    // 1. Add to recycle bin
    const recycleRef = doc(db, 'recycled_invoices', invoiceData.invoiceNo);
    await setDoc(recycleRef, {
      ...invoiceData,
      deletedAt: new Date().toISOString()
    });
    // 2. Remove from active invoices
    await deleteDoc(doc(db, 'invoices', invoiceData.invoiceNo));
    return true;
  } catch (error) {
    console.error('Error moving invoice to recycle bin:', error);
    return false;
  }
};

export const getRecycledInvoices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'recycled_invoices'));
    const invoices = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Handle timestamps if necessary
      if (data.date && typeof data.date.toDate === 'function') {
        data.date = data.date.toDate().toISOString();
      } else if (data.date && data.date.seconds) {
        data.date = new Date(data.date.seconds * 1000).toISOString();
      }
      invoices.push(data);
    });
    // Sort by deletedAt descending
    invoices.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
    return invoices;
  } catch (error) {
    console.error('Error getting recycled invoices:', error);
    return [];
  }
};

export const restoreInvoice = async (invoiceData) => {
  try {
    // 1. Add back to active invoices (remove deletedAt flag if desired, but we can just overwrite)
    const { deletedAt, ...restData } = invoiceData;
    const invoiceRef = doc(db, 'invoices', invoiceData.invoiceNo);
    await setDoc(invoiceRef, restData);

    // 2. Remove from recycle bin
    await deleteDoc(doc(db, 'recycled_invoices', invoiceData.invoiceNo));
    return true;
  } catch (error) {
    console.error('Error restoring invoice:', error);
    return false;
  }
};

export const deleteInvoicePermanently = async (invoiceNo) => {
  try {
    await deleteDoc(doc(db, 'recycled_invoices', invoiceNo));
    return true;
  } catch (error) {
    console.error('Error permanently deleting invoice:', error);
    return false;
  }
};

export const getTemplateData = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'template'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.date && typeof data.date.toDate === 'function') {
        data.date = data.date.toDate().toISOString();
      } else if (data.date && data.date.seconds) {
        data.date = new Date(data.date.seconds * 1000).toISOString();
      }
      if (data.poDate && typeof data.poDate.toDate === 'function') {
        data.poDate = data.poDate.toDate().toISOString();
      } else if (data.poDate && data.poDate.seconds) {
        data.poDate = new Date(data.poDate.seconds * 1000).toISOString();
      }
      return data;
    }
  } catch (error) {
    console.error('Error getting template:', error);
  }
  return null;
};

export const saveTemplateData = async (templateData) => {
  try {
    await setDoc(doc(db, 'settings', 'template'), templateData);
    return true;
  } catch (error) {
    console.error('Error saving template:', error);
    return false;
  }
};
