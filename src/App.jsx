import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileDown, FileText, Save, Loader2 } from 'lucide-react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Dashboard from './components/Dashboard';
import InvoiceHistory from './components/InvoiceHistory';
import RecycleBin from './components/RecycleBin';
import AlertModal from './components/AlertModal';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import { generateNextInvoiceNumber, saveInvoice, getTemplateData, saveTemplateData } from './utils/helpers';

const initialData = {
  invoiceNo: "",
  status: "Unpaid",
  date: new Date(2026, 0, 13), // Jan 13, 2026
  poNo: "",
  poDate: null,
  deliveryNote: "",
  paymentTerms: "",
  despatchThrough: "gorentla",
  destination: "S kothapalli",
  note: `Note: As per MOF Notification 24, 27/2018
Central tax dt:31/12/2018/
HSN/SAC" 00998736 GST Calculation@ 70% on taxable value @ 12% and 30% on taxable value @ 18%`,
  buyer: {
    pmsgNo: "",
    name: "Mr/Mrs ",
    address: "#6-61,S KOTHAPALLI -515601\nSRI SATYA SAI (DIST)ANDHRA PRADESH.",
    state: "ANDHRA PRADESH",
    stateCode: "37",
    mobile: ""
  },
  consignee: {
    pmsgNo: "",
    name: "Mr/Mrs ",
    address: "#6-61,S KOTHAPALLI -515601\nSRI SATYA SAI (DIST)ANDHRA PRADESH.",
    state: "ANDHRA PRADESH",
    stateCode: "37",
    mobile: ""
  },
  items: [
    {
      description: "Solar Power Generating System of 3 Kwp Roof Top on RCC",
      hsn: "854140",
      gstRate: 5,
      qty: 1,
      rate: 150000,
      unit: "Nos"
    },
    {
      description: "Transportation, Installation &Synchonization Charges",
      hsn: "995465",
      gstRate: 18,
      qty: 1,
      rate: 57203.39,
      unit: "OTH"
    }
  ],
  bankDetails: {
    name: "SURYODHAYA GREEN SOLAR",
    bankName: "STATE BANK OF INDIA",
    accountNo: "32498327487",
    ifscCode: "SBIN0012737",
    branch: "DHARMAVARAMO"
  },
  pan: "AQMPR7063E",
  gstin: "37AQMPR7063E1ZF"
};

function App() {
  const [data, setData] = useState(initialData);
  const [templateData, setTemplateData] = useState(initialData);
  const [activeTab, setActiveTabState] = useState(() => {
    // Restore tab from localStorage if it exists and isn't 'create'.
    // We don't restore 'create' because data would be lost on refresh anyway and could cause confusion.
    const savedTab = localStorage.getItem('invoiceAppActiveTab');
    return (savedTab && savedTab !== 'create') ? savedTab : 'home';
  });
  const [alert, setAlert] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    onConfirmAction: null,
    confirmText: 'OK',
    confirmStyle: 'btn-primary',
    onCancelAction: null,
    showCancel: false,
    cancelText: 'Cancel',
    onSaveAction: null,
    showSave: false,
    saveText: 'Save'
  });
  const [isGeneratingInvoiceNo, setIsGeneratingInvoiceNo] = useState(false);
  const [isSettingUpInvoice, setIsSettingUpInvoice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const componentRef = useRef();

  useEffect(() => {
    const fetchInitials = async () => {
      let tData = await getTemplateData();
      if (!tData) {
        tData = initialData;
      }
      setTemplateData(tData);

      if (!data.invoiceNo && activeTab === 'home') {
        const nextNo = await generateNextInvoiceNumber();
        setData({ ...tData, invoiceNo: nextNo });
      }
    };
    fetchInitials();

    // Website entry animation delay
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAlert = (title, message, type = 'success', options = {}) => {
    setAlert({
      isOpen: true,
      title,
      message,
      type,
      onConfirmAction: options.onConfirm || null,
      confirmText: options.confirmText || 'OK',
      confirmStyle: options.confirmStyle || 'btn-primary',
      showCancel: options.showCancel || false,
      onCancelAction: options.onCancel || null,
      cancelText: options.cancelText || 'Cancel',
      showSave: options.showSave || false,
      onSaveAction: options.onSave || null,
      saveText: options.saveText || 'Save'
    });
  };

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (tab !== 'create') {
      localStorage.setItem('invoiceAppActiveTab', tab);
    } else {
      // If we are creating/editing an invoice, on hard refresh we probably just want to go home,
      // since the local React state (the un-saved invoice) is lost anyway.
      localStorage.setItem('invoiceAppActiveTab', 'home');
    }
  };

  const closeAlert = () => {
    if (alert.onConfirmAction) {
      alert.onConfirmAction();
    }
    setAlert(prev => ({ ...prev, isOpen: false, onConfirmAction: null, onCancelAction: null, onSaveAction: null }));
  };

  const handleCancelAlert = () => {
    if (alert.onCancelAction) {
      alert.onCancelAction();
    }
    setAlert(prev => ({ ...prev, isOpen: false, onConfirmAction: null, onCancelAction: null, onSaveAction: null }));
  };

  const handleSaveAlert = () => {
    if (alert.onSaveAction) {
      alert.onSaveAction();
    }
    setAlert(prev => ({ ...prev, isOpen: false, onConfirmAction: null, onCancelAction: null, onSaveAction: null }));
  };

  const handleCreateNewInvoice = async () => {
    setIsGeneratingInvoiceNo(true);
    const newInvoiceNo = await generateNextInvoiceNumber();

    // Add artificial delay to see the animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsGeneratingInvoiceNo(false);

    // Show alert first, pass a callback to execute when the user clicks OK
    showAlert(
      'New Invoice',
      `Generate new invoice ${newInvoiceNo}?`,
      'success',
      {
        onConfirm: () => {
          // They clicked OK
          setIsSettingUpInvoice(true);
          setTimeout(() => {
            setData({
              ...templateData,
              invoiceNo: newInvoiceNo,
              date: new Date().toISOString() // Set current date as default
            });
            setIsDirty(true); // Newly created invoice is conceptually dirty since it hasn't been saved to DB yet
            setIsSettingUpInvoice(false);
            setActiveTab('create');
          }, 1000); // 1 seconds delay
        },
        showCancel: true,
        onCancel: () => {
          // They clicked Cancel
          console.log("Invoice creation cancelled");
        }
      }
    );
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${data.invoiceNo}`,
    onAfterPrint: () => setIsPrinting(false),
    onPrintError: () => setIsPrinting(false)
  });

  const handleSaveAndPrint = async () => {
    setIsPrinting(true);
    await saveInvoice(data);
    setIsDirty(false); // Reset on save
    // Add artificial delay to see the animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    handlePrint();
  };

  const handleDirectDownload = async () => {
    setIsDownloading(true);
    await saveInvoice(data);
    setIsDirty(false);

    // Add artificial delay to see the animation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const opt = {
      margin: 0,
      filename: `Invoice_${data.invoiceNo}.pdf`,
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

    html2pdf().from(componentRef.current).set(opt).save().then(() => {
      setIsDownloading(false);
    });
  };

  const handleSaveOnly = async () => {
    setIsSaving(true);
    // Add artificial delay to see the animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = await saveInvoice(data);
    setIsSaving(false);

    if (success) {
      setIsDirty(false); // Reset on save
      showAlert('Success', "Invoice saved successfully!", 'success');
    } else {
      showAlert('Error', "Error saving invoice.", 'error');
    }
  };

  const handleViewFromHistory = (invoiceData) => {
    setData(invoiceData);
    setIsDirty(false); // Clean loaded data starts fresh
    setActiveTab('create');
  };

  const handleBackToDashboard = () => {
    if ((activeTab === 'create' || activeTab === 'template') && isDirty) {
      showAlert(
        'Unsaved Changes',
        'You have unsaved changes. Would you like to save before exiting?',
        'warning',
        {
          confirmText: 'Exit without saving',
          confirmStyle: 'btn-danger',
          onConfirm: () => {
            setIsDirty(false);
            setActiveTab('home');
          },
          showCancel: true,
          cancelText: 'Cancel',
          onCancel: null, // Just closes modal, stays on page
          showSave: true,
          saveText: 'Save & Exit',
          onSave: async () => {
            if (activeTab === 'template') {
              const success = await saveTemplateData(templateData);
              if (success) {
                setIsDirty(false);
                setActiveTab('home');
              } else {
                alert("Error saving template");
              }
            } else {
              const success = await saveInvoice(data);
              if (success) {
                setIsDirty(false); // Cleanup globally
                setActiveTab('home');
              } else {
                // We could alert an error here if we wanted
                alert("Error saving invoice");
              }
            }
          }
        }
      );
    } else {
      setActiveTab('home');
    }
  };

  // Wrapper for setData to trigger dirty state
  const handleDataChange = (newData) => {
    setData(newData);
    setIsDirty(true);
  };

  const handleTemplateDataChange = (newData) => {
    setTemplateData(newData);
    setIsDirty(true);
  };

  return (
    <>
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            key="entry-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'var(--bg-app)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.img
              src="/logo.png"
              alt="Logo"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ width: '150px', marginBottom: '1.5rem' }}
            />
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              style={{ color: 'var(--primary)', fontSize: '2rem', fontWeight: 700 }}
            >
              Suryodhaya Green Solar
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
              style={{
                marginTop: '2rem',
                width: '200px',
                height: '4px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '50%',
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '2px'
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-container">
        {/* Keeping Header global or it can be moved into Dashboard, but simple to keep here */}
        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} onCreateNewInvoice={handleCreateNewInvoice} onBackToDashboard={handleBackToDashboard}>
          {activeTab === 'create' ? (
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1rem' }}>
              <div className="header-actions" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  className="btn"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  onClick={handleSaveOnly}
                  disabled={isSaving || isPrinting}
                >
                  <><Save size={20} /> Save Draft</>
                </button>
                <button
                  className="btn"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--primary)' }}
                  onClick={handleDirectDownload}
                  disabled={isSaving || isPrinting || isDownloading}
                >
                  {isDownloading ? (
                    <><Loader2 size={20} className="animate-spin" /> Downloading...</>
                  ) : (
                    <><FileDown size={20} /> Direct Download</>
                  )}
                </button>
                <button
                  className="btn btn-primary hide-on-mobile"
                  onClick={handleSaveAndPrint}
                  disabled={isSaving || isPrinting || isDownloading}
                >
                  {isPrinting ? (
                    <><Loader2 size={20} className="animate-spin" /> Printing...</>
                  ) : (
                    <><FileDown size={20} /> Save & Print (PDF)</>
                  )}
                </button>
              </div>

              <div className="create-invoice-layout">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card no-print form-panel"
                >
                  <InvoiceForm data={data} setData={handleDataChange} onViewInvoice={handleViewFromHistory} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="preview-panel"
                >
                  <div className="preview-scale-wrapper">
                    <InvoicePreview ref={componentRef} data={data} />
                  </div>
                </motion.div>
              </div>
            </div>
          ) : activeTab === 'template' ? (
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1rem' }}>
              <div className="header-actions" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Edit Default Invoice Template</h2>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setIsSaving(true);
                    const success = await saveTemplateData(templateData);
                    setIsSaving(false);
                    if (success) {
                      setIsDirty(false);
                      showAlert('Success', "Template saved successfully!", 'success');
                    } else {
                      showAlert('Error', "Error saving template.", 'error');
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><Loader2 size={20} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={20} /> Save Template</>
                  )}
                </button>
              </div>

              <div className="create-invoice-layout">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card no-print form-panel"
                >
                  <InvoiceForm data={templateData} setData={handleTemplateDataChange} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="preview-panel"
                >
                  <div className="preview-scale-wrapper">
                    <InvoicePreview data={templateData} />
                  </div>
                </motion.div>
              </div>
            </div>
          ) : activeTab === 'recyclebin' ? (
            <RecycleBin />
          ) : (
            <InvoiceHistory onViewInvoice={handleViewFromHistory} />
          )}
        </Dashboard>

        {isSettingUpInvoice && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem', minWidth: '350px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(37, 99, 235, 0.2)',
                  borderTop: '4px solid var(--primary)',
                  borderRadius: '50%'
                }}
              />
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.5' }}
              >
                Please wait...<br />We are setting up your invoice page.
              </motion.h2>
            </div>
          </div>
        )}

        {isGeneratingInvoiceNo && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem', minWidth: '350px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(168, 85, 247, 0.2)', // purple-500
                  borderTop: '4px solid #a855f7',
                  borderRadius: '50%'
                }}
              />
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.5' }}
              >
                Generating Invoice Number...<br />Please wait.
              </motion.h2>
            </div>
          </div>
        )}

        {isSaving && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '3rem', minWidth: '350px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(34, 197, 94, 0.2)',
                  borderTop: '4px solid #22c55e',
                  borderRadius: '50%'
                }}
              />
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem', color: 'var(--text-main)', textAlign: 'center', lineHeight: '1.5' }}
              >
                Saving...<br />Please wait while your invoice is saved.
              </motion.h2>
            </div>
          </div>
        )}

        <AlertModal
          isOpen={alert.isOpen}
          title={alert.title}
          message={alert.message}
          type={alert.type}

          showCancel={alert.showCancel}
          cancelText={alert.cancelText}
          onCancel={handleCancelAlert}

          showSave={alert.showSave}
          saveText={alert.saveText}
          onSave={handleSaveAlert}

          confirmText={alert.confirmText}
          confirmStyle={alert.confirmStyle}
          onConfirm={closeAlert}
        />
      </div>
    </>
  );
}

export default App;
