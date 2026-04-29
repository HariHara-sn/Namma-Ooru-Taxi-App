module.exports = {
    company: {
        name: process.env.COMPANY_NAME || 'VM Trackers',
        address: process.env.COMPANY_ADDRESS || '—',
        gstin: process.env.COMPANY_GSTIN || '',
        pan: process.env.COMPANY_PAN || '',
        supportEmail: process.env.COMPANY_SUPPORT_EMAIL || (process.env.MAIL_FROM || ''),
        supportPhone: process.env.COMPANY_SUPPORT_PHONE || ''
    },
    product: {
        id: process.env.PRODUCT_ID || '',
        hsnCode: process.env.HSN_CODE || ''
    },
    tax: {
        // Change here once, it reflects everywhere
        mode: process.env.GST_TAX_MODE || 'INTRA', // INTRA => CGST+SGST, INTER => IGST
        cgstPercent: Number(process.env.CGST_PERCENT || 9),
        sgstPercent: Number(process.env.SGST_PERCENT || 9),
        igstPercent: Number(process.env.IGST_PERCENT || 18)
    },
    invoice: {
        prefix: process.env.INVOICE_PREFIX || 'INV',
        // Optional year suffix e.g. INV-2025-000123
        includeYear: (process.env.INVOICE_INCLUDE_YEAR || 'true').toLowerCase() !== 'false'
    }
};
