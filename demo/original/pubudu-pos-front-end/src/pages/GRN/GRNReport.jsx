import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';

// Import components
import { LoadingSpinner } from '../../components/GrnReport/Loading-';
import { EmptyState } from '../../components/GrnReport/EmptyState';
import { HeaderActions } from '../../components/GrnReport/HeaderActions';
import { Watermark } from '../../components/GrnReport/Watermark';
import { CompanyHeader } from '../../components/GrnReport/CompanyHeader';
import { ReportTitle } from '../../components/GrnReport/ReportTitle';
import { GrnDetails } from '../../components/GrnReport/GrnDetails';
import { FinancialSummary } from '../../components/GrnReport/FinancialSummary';
import { ItemsTable } from '../../components/GrnReport/ItemsTable';
import { SummaryStats } from '../../components/GrnReport/SummaryStats';
import { ReportFooter } from '../../components/GrnReport/ReportFooter';

export default function GrnReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const reportRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem("grn_report_data");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing GRN data:", error);
      }
    }
    setLoading(false);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/stock/grn');
  }, [navigate]);

  const handleDownloadPDF = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `GRN_Report_${data?.grn_code || ''}`,
    onAfterPrint: () => {
      setTimeout(() => {
        navigate('/stock/grn');
      }, 1000);
    }
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <EmptyState onBack={handleBack} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <HeaderActions onBack={handleBack} onDownload={handleDownloadPDF} />

      {/* Report Content - Professional Classic Design */}
      <div ref={reportRef} className="bg-white p-8 border border-gray-300">
        <Watermark />
        <CompanyHeader />
        <ReportTitle />
        <GrnDetails data={data} />
        <FinancialSummary data={data} />
        <ItemsTable items={data.items || []} />
        <SummaryStats items={data.items || []} />
        <ReportFooter data={data} />
      </div>

      <GlobalStyles />
    </div>
  );
}

function GlobalStyles() {
  return (
    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
        }
        .no-print {
          display: none !important;
        }
      }

      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        opacity: 0.1;
        z-index: 1000;
        pointer-events: none;
      }

      .watermark-text {
        font-size: 80px;
        font-weight: bold;
        color: #000;
        white-space: nowrap;
      }

      @media print {
        .watermark {
          position: fixed;
        }
      }
    `}</style>
  );
}