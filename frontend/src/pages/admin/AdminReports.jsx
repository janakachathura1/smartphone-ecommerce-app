import { useState } from 'react';
import { QueryErrorResetBoundary, useQuery } from '@tanstack/react-query';
import {
  RiBarChart2Line, RiPrinterLine, RiDownload2Line, RiCalendarLine,
  RiFileTextLine, RiSearch2Line
} from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader } from '../../components/ui';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminReports() {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [queryEnabled, setQueryEnabled] = useState(false);

  const { data: reportData = [], isLoading, isFetching } = useQuery({
    queryKey: ['admin-reports', reportType, startDate, endDate],
    queryFn: () =>
      api.get('/admin/reports', { params: { type: reportType, startDate, endDate } })
        .then((r) => r.data?.data || []),
    enabled: queryEnabled,
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    setQueryEnabled(true);

  };

  const getReportName = () => {
    switch (reportType) {
      case 'sales':
        return 'Sales & Revenue Report';
      case 'inventory':
        return 'Product Inventory & Valuation Report';
      case 'brand':
        return 'Brand-wise Sales Performance Report';
      case 'coupon':
        return 'Coupon & Promotions Performance Report';
      case 'customer':
        return 'Top Customers & Loyalty Report';
      default:
        return 'Business Report';
    }
  };

  // Generate and download a beautifully styled PDF document
  const handleDownloadPDF = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data available to download');
      return;
    }

    const doc = new jsPDF();
    const title = getReportName();
    const rangeText = reportType === 'inventory'
      ? `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
      : `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;

    // Header Styling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // dark grey
    doc.text(title, 14, 20);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(rangeText, 14, 26);

    // Accent line (Primary Color #2563eb)
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.line(14, 30, 196, 30);

    let headers = [];
    let rows = [];

    if (reportType === 'sales') {
      headers = [['Order Number', 'Customer', 'Email', 'Date', 'Payment', 'Discount', 'Total Amount']];
      rows = reportData.map(o => [
        `#${o.orderNumber}`,
        `${o.user?.firstName || ''} ${o.user?.lastName || ''}`,
        o.user?.email || 'N/A',
        new Date(o.createdAt).toLocaleDateString(),
        o.paymentMethod?.toUpperCase(),
        `-${formatPrice(o.discountAmount)}`,
        formatPrice(o.totalAmount)
      ]);
    } else if (reportType === 'inventory') {
      headers = [['Product Model', 'Brand', 'Category', 'SKU', 'Stock', 'Unit Price', 'Stock Value']];
      rows = reportData.map(p => [
        p.name,
        p.brand?.name || 'N/A',
        p.category?.name || 'N/A',
        p.sku,
        `${p.stock} items`,
        formatPrice(p.finalPrice),
        formatPrice(p.stock * p.finalPrice)
      ]);
    } else if (reportType === 'brand') {
      headers = [['Brand Name', 'Units Sold', 'Total Gross Revenue']];
      rows = reportData.map(b => [b.brand, `${b.unitsSold} units`, formatPrice(b.revenue)]);
    } else if (reportType === 'coupon') {
      headers = [['Coupon Code', 'Uses Count', 'Total Discount Offered', 'Total Revenue Generated']];
      rows = reportData.map(c => [c.code, `${c.uses} times`, `-${formatPrice(c.totalDiscount)}`, formatPrice(c.totalRevenue)]);
    } else if (reportType === 'customer') {
      headers = [['Customer Name', 'Email', 'Phone Number', 'Orders Count', 'Total Spent']];
      rows = reportData.map(u => [u.name, u.email, u.phone, `${u.orders} orders`, formatPrice(u.spent)]);
    }

    autoTable(doc, {
      startY: 35,
      head: headers,
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // Primary blue #2563eb
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85], // Slate 700
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate 50
      },
      columnStyles: {
        5: { halign: reportType === 'sales' || reportType === 'inventory' ? 'right' : 'left' },
        6: { halign: 'right' },
        2: { halign: reportType === 'brand' ? 'right' : 'left' },
        3: { halign: reportType === 'coupon' ? 'right' : 'left' },
        4: { halign: reportType === 'customer' ? 'right' : 'left' },
      },
      didDrawPage: (data) => {
        // Footer: Page numbers
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`${reportType}_report_${startDate}_to_${endDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 rounded-3xl border border-secondary-100 shadow-sm no-print">
        <div>
          <h1 className="text-2xl font-black text-secondary-900 flex items-center gap-2 uppercase tracking-tight">
            <RiBarChart2Line className="text-primary-600" /> Business Reports Hub
          </h1>
          <p className="text-xs text-secondary-500 mt-1 font-medium">Generate detailed business metrics, download Excel spreadsheets, and print PDF logs.</p>
        </div>
      </div>

      {/* Filter Form Card */}
      <div className="card p-6 bg-white border border-secondary-100 rounded-3xl shadow-sm no-print">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-secondary-700 block mb-1.5 uppercase tracking-wider">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setQueryEnabled(false);
              }}
              className="input text-sm py-2.5 w-full bg-secondary-50 border-secondary-100 rounded-xl"
            >
              <option value="sales">Sales & Revenue Report</option>
              <option value="inventory">Product Inventory & Valuation</option>
              <option value="brand">Brand Sales Performance</option>
              <option value="coupon">Coupon Usage Analytics</option>
              <option value="customer">Top Buyers & Loyalty</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary-700 block mb-1.5 uppercase tracking-wider">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQueryEnabled(false);
                }}
                disabled={reportType === 'inventory'}
                className="input text-sm py-2.5 w-full bg-secondary-50 border-secondary-100 rounded-xl pl-9"
              />
              <RiCalendarLine className="absolute left-3 top-3 text-secondary-400" size={16} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary-700 block mb-1.5 uppercase tracking-wider">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQueryEnabled(false);
                }}
                disabled={reportType === 'inventory'}
                className="input text-sm py-2.5 w-full bg-secondary-50 border-secondary-100 rounded-xl pl-9"
              />
              <RiCalendarLine className="absolute left-3 top-3 text-secondary-400" size={16} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isFetching}
            className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-glow"
          >
            <RiSearch2Line size={18} />
            {isFetching ? 'Loading Data...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {/* Report Output Content Area */}
      {queryEnabled && (isLoading || isFetching) && (
        <div className="card p-12 bg-white border border-secondary-100 rounded-3xl shadow-sm text-center">
          <PageLoader className="mx-auto w-10 h-10 text-primary-600 mb-4 animate-spin" />
          <p className="text-sm font-semibold text-secondary-500">Querying database, aggregating tables, compiling report metrics...</p>
        </div>
      )}

      {queryEnabled && !isLoading && !isFetching && (
        <div id="printable-report-area" className="card p-6 md:p-8 bg-white border border-secondary-100 rounded-3xl shadow-sm space-y-6">

          {/* Output Action Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-secondary-100 pb-6">
            <div>
              <h2 className="text-xl font-black text-secondary-900 tracking-tight flex items-center gap-2">
                <RiFileTextLine className="text-primary-600" />
                {getReportName()}
              </h2>
              <p className="text-xs text-secondary-400 font-semibold mt-1">
                {reportType === 'inventory'
                  ? `Inventory snapshot generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
                  : `Reporting Interval: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`}
              </p>
            </div>

            <div className="flex gap-2.5 no-print">
              <button
                onClick={handlePrint}
                className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RiPrinterLine size={15} /> Print Report
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-glow"
              >
                <RiDownload2Line size={15} /> Download PDF
              </button>
            </div>
          </div>

          {/* Tabular Layout */}
          <div className="overflow-x-auto">
            {reportData.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary-50 border-y border-secondary-100 text-secondary-500 font-bold uppercase tracking-wider">
                    {reportType === 'sales' && (
                      <>
                        <th className="py-3 px-4">Order Number</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4 text-right">Discount</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                      </>
                    )}
                    {reportType === 'inventory' && (
                      <>
                        <th className="py-3 px-4">Product Model</th>
                        <th className="py-3 px-4">Brand</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4 text-center">In Stock</th>
                        <th className="py-3 px-4 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">Valuation</th>
                      </>
                    )}
                    {reportType === 'brand' && (
                      <>
                        <th className="py-3 px-4">Brand Name</th>
                        <th className="py-3 px-4 text-center">Units Sold</th>
                        <th className="py-3 px-4 text-right">Gross Revenue</th>
                      </>
                    )}
                    {reportType === 'coupon' && (
                      <>
                        <th className="py-3 px-4">Coupon Code</th>
                        <th className="py-3 px-4 text-center">Uses Count</th>
                        <th className="py-3 px-4 text-right">Discounts Offered</th>
                        <th className="py-3 px-4 text-right">Revenue Generated</th>
                      </>
                    )}
                    {reportType === 'customer' && (
                      <>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4 text-center">Orders Count</th>
                        <th className="py-3 px-4 text-right">Total Spent</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-secondary-50/50 transition-colors font-medium text-secondary-800">
                      {reportType === 'sales' && (
                        <>
                          <td className="py-3.5 px-4 font-bold text-secondary-900">#{row.orderNumber}</td>
                          <td className="py-3.5 px-4">{row.user?.firstName} {row.user?.lastName}</td>
                          <td className="py-3.5 px-4">{new Date(row.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 uppercase text-[10px]"><span className="bg-secondary-100 px-2 py-0.5 rounded font-bold">{row.paymentMethod}</span></td>
                          <td className="py-3.5 px-4 text-right text-red-500 font-bold">-{formatPrice(row.discountAmount)}</td>
                          <td className="py-3.5 px-4 text-right font-black text-secondary-950">{formatPrice(row.totalAmount)}</td>
                        </>
                      )}
                      {reportType === 'inventory' && (
                        <>
                          <td className="py-3.5 px-4 font-bold text-secondary-900">{row.name}</td>
                          <td className="py-3.5 px-4">{row.brand?.name}</td>
                          <td className="py-3.5 px-4">{row.category?.name}</td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-secondary-500">{row.sku}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold ${row.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-secondary-100'}`}>
                              {row.stock} items
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold">{formatPrice(row.finalPrice)}</td>
                          <td className="py-3.5 px-4 text-right font-black text-primary-650">{formatPrice(row.stock * row.finalPrice)}</td>
                        </>
                      )}
                      {reportType === 'brand' && (
                        <>
                          <td className="py-3.5 px-4 font-bold text-secondary-900">{row.brand}</td>
                          <td className="py-3.5 px-4 text-center font-bold">{row.unitsSold} units</td>
                          <td className="py-3.5 px-4 text-right font-black text-primary-650">{formatPrice(row.revenue)}</td>
                        </>
                      )}
                      {reportType === 'coupon' && (
                        <>
                          <td className="py-3.5 px-4 font-bold text-secondary-900">{row.code}</td>
                          <td className="py-3.5 px-4 text-center font-bold">{row.uses} times</td>
                          <td className="py-3.5 px-4 text-right text-red-500 font-bold">-{formatPrice(row.totalDiscount)}</td>
                          <td className="py-3.5 px-4 text-right font-black text-primary-650">{formatPrice(row.totalRevenue)}</td>
                        </>
                      )}
                      {reportType === 'customer' && (
                        <>
                          <td className="py-3.5 px-4 font-bold text-secondary-900">{row.name}</td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-secondary-500">{row.email}</td>
                          <td className="py-3.5 px-4">{row.phone}</td>
                          <td className="py-3.5 px-4 text-center font-bold">{row.orders} orders</td>
                          <td className="py-3.5 px-4 text-right font-black text-primary-650">{formatPrice(row.spent)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 text-secondary-500 space-y-2">
                <p className="font-bold text-sm">No transaction records found</p>
                <p className="text-xs">Adjust your date range filters or verify if orders are paid for the selected interval.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
