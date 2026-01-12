import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    FileText,
    Download,
    Calendar,
    Loader2,
    FolderGit2,
    Film,
    FileSpreadsheet,
    Video,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Check,
    FileDown,
    Table2
} from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();
    const {
        projects,
        videos,
        scripts,
        postProductions,
        fetchProjects,
        fetchVideos,
        fetchScripts,
        fetchPostProductions,
        loadingProjects,
        loadingVideos,
        loadingScripts,
        loadingPostProductions
    } = useData();

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return { month: now.getMonth(), year: now.getFullYear() };
    });
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchVideos();
        fetchScripts();
        fetchPostProductions();
    }, [fetchProjects, fetchVideos, fetchScripts, fetchPostProductions]);

    const isLoading = loadingProjects || loadingVideos || loadingScripts || loadingPostProductions;

    // Get month name
    const getMonthName = (month) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    };

    // Check if date is in selected month
    const isInSelectedMonth = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getMonth() === selectedMonth.month && date.getFullYear() === selectedMonth.year;
    };

    // Filter data by selected month
    const monthlyData = useMemo(() => {
        const projectsList = projects || [];
        const videosList = videos || [];
        const scriptsList = scripts || [];
        const postProductionsList = postProductions || [];

        // Filter by month (using createdAt or startDate)
        const monthProjects = projectsList.filter(p =>
            isInSelectedMonth(p.createdAt?.toDate?.() || p.startDate || p.createdAt)
        );
        const monthVideos = videosList.filter(v =>
            isInSelectedMonth(v.createdAt?.toDate?.() || v.shootDate || v.createdAt)
        );
        const monthScripts = scriptsList.filter(s =>
            isInSelectedMonth(s.createdAt?.toDate?.() || s.createdAt)
        );
        const monthPostProductions = postProductionsList.filter(pp =>
            isInSelectedMonth(pp.createdAt?.toDate?.() || pp.createdAt)
        );

        return {
            projects: {
                all: monthProjects,
                total: monthProjects.length,
                completed: monthProjects.filter(p => p.status === 'complete').length,
                inProgress: monthProjects.filter(p => p.status === 'in-progress').length,
                onHold: monthProjects.filter(p => p.status === 'on-hold').length
            },
            videos: {
                all: monthVideos,
                total: monthVideos.length,
                completed: monthVideos.filter(v => v.shootStatus === 'Completed').length,
                scheduled: monthVideos.filter(v => v.shootStatus === 'Scheduled').length,
                pending: monthVideos.filter(v => v.shootStatus === 'Pending').length
            },
            scripts: {
                all: monthScripts,
                total: monthScripts.length,
                approved: monthScripts.filter(s => s.status === 'Approved').length,
                inReview: monthScripts.filter(s => s.status === 'In Review').length,
                draft: monthScripts.filter(s => s.status === 'Draft').length
            },
            postProductions: {
                all: monthPostProductions,
                total: monthPostProductions.length,
                completed: monthPostProductions.filter(pp => pp.status === 'Completed').length,
                inProgress: monthPostProductions.filter(pp => pp.status === 'In Progress').length
            }
        };
    }, [projects, videos, scripts, postProductions, selectedMonth]);

    // Overall stats for the month
    const overallStats = useMemo(() => {
        const totalItems = monthlyData.projects.total + monthlyData.videos.total +
            monthlyData.scripts.total + monthlyData.postProductions.total;
        const totalCompleted = monthlyData.projects.completed + monthlyData.videos.completed +
            monthlyData.scripts.approved + monthlyData.postProductions.completed;
        const completionRate = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

        return { totalItems, totalCompleted, completionRate };
    }, [monthlyData]);

    // Navigate months
    const prevMonth = () => {
        setSelectedMonth(prev => {
            if (prev.month === 0) {
                return { month: 11, year: prev.year - 1 };
            }
            return { month: prev.month - 1, year: prev.year };
        });
    };

    const nextMonth = () => {
        setSelectedMonth(prev => {
            if (prev.month === 11) {
                return { month: 0, year: prev.year + 1 };
            }
            return { month: prev.month + 1, year: prev.year };
        });
    };

    // State for success message
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('pdf'); // 'pdf' or 'excel'

    // Generate PDF Report
    const generatePDF = async () => {
        setGenerating(true);
        setDownloadSuccess(false);

        try {
            const doc = new jsPDF();
            const monthYear = `${getMonthName(selectedMonth.month)} ${selectedMonth.year}`;
            const pageWidth = doc.internal.pageSize.getWidth();
            const fileName = `AAA_Studios_Report_${getMonthName(selectedMonth.month)}_${selectedMonth.year}.pdf`;

            // Header
            doc.setFillColor(30, 41, 59); // Dark blue
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('AAA Studios', 14, 20);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(`Monthly Report - ${monthYear}`, 14, 30);

            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 30, { align: 'right' });
            doc.text(`Generated by: ${user?.name || 'Admin'}`, pageWidth - 14, 20, { align: 'right' });

            let yPos = 50;

            // Executive Summary
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Executive Summary', 14, yPos);
            yPos += 10;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);

            const summaryData = [
                ['Total Items Created', overallStats.totalItems.toString()],
                ['Items Completed', overallStats.totalCompleted.toString()],
                ['Completion Rate', `${overallStats.completionRate}%`],
                ['Projects', monthlyData.projects.total.toString()],
                ['Videos', monthlyData.videos.total.toString()],
                ['Scripts', monthlyData.scripts.total.toString()],
                ['Post-Productions', monthlyData.postProductions.total.toString()]
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Metric', 'Value']],
                body: summaryData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246], textColor: 255 },
                styles: { fontSize: 10 },
                columnStyles: { 0: { fontStyle: 'bold' } },
                margin: { left: 14, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            // Projects Section
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Projects Overview', 14, yPos);
            yPos += 8;

            const projectsStats = [
                ['Total Projects', monthlyData.projects.total],
                ['Completed', monthlyData.projects.completed],
                ['In Progress', monthlyData.projects.inProgress],
                ['On Hold', monthlyData.projects.onHold]
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Status', 'Count']],
                body: projectsStats,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 10 },
                margin: { left: 14, right: pageWidth / 2 + 7 }
            });

            // Videos Section (side by side)
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Videos Overview', pageWidth / 2 + 7, yPos);

            const videosStats = [
                ['Total Videos', monthlyData.videos.total],
                ['Completed', monthlyData.videos.completed],
                ['Scheduled', monthlyData.videos.scheduled],
                ['Pending', monthlyData.videos.pending]
            ];

            autoTable(doc, {
                startY: yPos + 8,
                head: [['Status', 'Count']],
                body: videosStats,
                theme: 'grid',
                headStyles: { fillColor: [139, 92, 246] },
                styles: { fontSize: 10 },
                margin: { left: pageWidth / 2 + 7, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            // Check if need new page
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            // Scripts Section
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Scripts Overview', 14, yPos);
            yPos += 8;

            const scriptsStats = [
                ['Total Scripts', monthlyData.scripts.total],
                ['Approved', monthlyData.scripts.approved],
                ['In Review', monthlyData.scripts.inReview],
                ['Draft', monthlyData.scripts.draft]
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Status', 'Count']],
                body: scriptsStats,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 10 },
                margin: { left: 14, right: pageWidth / 2 + 7 }
            });

            // Post-Productions Section
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Post-Productions Overview', pageWidth / 2 + 7, yPos);

            const ppStats = [
                ['Total Post-Productions', monthlyData.postProductions.total],
                ['Completed', monthlyData.postProductions.completed],
                ['In Progress', monthlyData.postProductions.inProgress]
            ];

            autoTable(doc, {
                startY: yPos + 8,
                head: [['Status', 'Count']],
                body: ppStats,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] },
                styles: { fontSize: 10 },
                margin: { left: pageWidth / 2 + 7, right: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            // Detailed Project List
            if (monthlyData.projects.all.length > 0) {
                if (yPos > 220) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setTextColor(30, 41, 59);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Project Details', 14, yPos);
                yPos += 8;

                const projectRows = monthlyData.projects.all.map(p => [
                    p.name || 'Untitled',
                    p.clientName || 'N/A',
                    p.status || 'N/A',
                    p.noOfVideoAssign || 0,
                    p.startDate || 'N/A'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Project Name', 'Client', 'Status', 'Videos', 'Start Date']],
                    body: projectRows,
                    theme: 'striped',
                    headStyles: { fillColor: [59, 130, 246] },
                    styles: { fontSize: 9 },
                    margin: { left: 14, right: 14 }
                });

                yPos = doc.lastAutoTable.finalY + 15;
            }

            // Detailed Video List
            if (monthlyData.videos.all.length > 0) {
                if (yPos > 220) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setTextColor(30, 41, 59);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Video Details', 14, yPos);
                yPos += 8;

                const videoRows = monthlyData.videos.all.slice(0, 20).map(v => [
                    v.name || v.videoName || 'Untitled',
                    v.shootStatus || 'N/A',
                    v.shootDate || 'N/A',
                    v.editor || 'N/A'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Video Name', 'Status', 'Shoot Date', 'Editor']],
                    body: videoRows,
                    theme: 'striped',
                    headStyles: { fillColor: [139, 92, 246] },
                    styles: { fontSize: 9 },
                    margin: { left: 14, right: 14 }
                });
            }

            // Detailed Scripts List
            if (monthlyData.scripts.all.length > 0) {
                doc.addPage();
                yPos = 20;

                doc.setTextColor(30, 41, 59);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Script Details', 14, yPos);
                yPos += 8;

                const scriptRows = monthlyData.scripts.all.slice(0, 20).map(s => [
                    s.scriptName || s.title || 'Untitled',
                    s.clientName || 'N/A',
                    s.contentType || 'N/A',
                    s.status || 'N/A'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Script Name', 'Client', 'Content Type', 'Status']],
                    body: scriptRows,
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] },
                    styles: { fontSize: 9 },
                    margin: { left: 14, right: 14 }
                });

                yPos = doc.lastAutoTable.finalY + 15;
            }

            // Detailed Post-Productions List
            if (monthlyData.postProductions.all.length > 0) {
                if (yPos > 220) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setTextColor(30, 41, 59);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Post-Production Details', 14, yPos);
                yPos += 8;

                const ppRows = monthlyData.postProductions.all.slice(0, 20).map(pp => [
                    pp.videoName || pp.title || 'Untitled',
                    pp.editor || 'N/A',
                    pp.status || 'N/A',
                    pp.priority || 'Normal'
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Video Name', 'Editor', 'Status', 'Priority']],
                    body: ppRows,
                    theme: 'striped',
                    headStyles: { fillColor: [245, 158, 11] },
                    styles: { fontSize: 9 },
                    margin: { left: 14, right: 14 }
                });
            }

            // Footer on all pages
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `AAA Studios - Monthly Report | Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // Save PDF using blob method for reliable filename
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Clean up blob URL
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 100);

            // Show success message
            setDownloadSuccess(true);
            console.log(`✅ PDF Report saved: ${fileName}`);

            // Hide success message after 5 seconds
            setTimeout(() => {
                setDownloadSuccess(false);
            }, 5000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(`Failed to generate report: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setGenerating(false);
        }
    };

    // Generate Excel Report
    const generateExcel = async () => {
        setGenerating(true);
        setDownloadSuccess(false);

        try {
            const monthYear = `${getMonthName(selectedMonth.month)} ${selectedMonth.year}`;
            const fileName = `AAA_Studios_Report_${getMonthName(selectedMonth.month)}_${selectedMonth.year}.xlsx`;

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Summary Sheet
            const summaryData = [
                ['AAA Studios - Monthly Report'],
                [`Report Period: ${monthYear}`],
                [`Generated: ${new Date().toLocaleDateString()}`],
                [`Generated by: ${user?.name || 'Admin'}`],
                [],
                ['EXECUTIVE SUMMARY'],
                ['Metric', 'Value'],
                ['Total Items Created', overallStats.totalItems],
                ['Items Completed', overallStats.totalCompleted],
                ['Completion Rate', `${overallStats.completionRate}%`],
                [],
                ['BREAKDOWN BY CATEGORY'],
                ['Category', 'Total', 'Completed', 'In Progress', 'Other'],
                ['Projects', monthlyData.projects.total, monthlyData.projects.completed, monthlyData.projects.inProgress, monthlyData.projects.onHold],
                ['Videos', monthlyData.videos.total, monthlyData.videos.completed, monthlyData.videos.scheduled, monthlyData.videos.pending],
                ['Scripts', monthlyData.scripts.total, monthlyData.scripts.approved, monthlyData.scripts.inReview, monthlyData.scripts.draft],
                ['Post-Productions', monthlyData.postProductions.total, monthlyData.postProductions.completed, monthlyData.postProductions.inProgress, '-']
            ];
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

            // Set column widths for summary
            summarySheet['!cols'] = [
                { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

            // Projects Sheet - COMPREHENSIVE
            if (monthlyData.projects.all.length > 0) {
                const projectsData = [
                    ['PROJECT DETAILS - COMPREHENSIVE REPORT'],
                    [],
                    ['Project Name', 'Client', 'Status', 'Videos Assigned', 'Start Date', 'Delivery Date', 'Re-Edits Date', 'Pre-Production Team', 'Post-Production Team', 'Drive Link', 'Special Notes']
                ];
                monthlyData.projects.all.forEach(p => {
                    projectsData.push([
                        p.name || 'Untitled',
                        p.clientName || 'N/A',
                        p.status || 'N/A',
                        p.noOfVideoAssign || 0,
                        p.startDate || 'N/A',
                        p.dateOfDelivery || 'N/A',
                        p.reEditsRevisionDate || 'N/A',
                        Array.isArray(p.preProductionTeam) ? p.preProductionTeam.join(', ') : (p.preProductionTeam || 'N/A'),
                        Array.isArray(p.postProductionTeam) ? p.postProductionTeam.join(', ') : (p.postProductionTeam || 'N/A'),
                        p.projectDriveLink || 'N/A',
                        p.specialNotes || ''
                    ]);
                });
                const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
                projectsSheet['!cols'] = [
                    { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
                    { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 40 }
                ];
                XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
            }

            // Videos Sheet - COMPREHENSIVE
            if (monthlyData.videos.all.length > 0) {
                const videosData = [
                    ['VIDEO DETAILS - COMPREHENSIVE REPORT'],
                    [],
                    ['Video Name', 'Product', 'Video Type', 'Talent', 'Shoot Day', 'Shoot Status', 'Project', 'Client', 'Script Link', 'Storyboard Link', 'Special Notes']
                ];
                monthlyData.videos.all.forEach(v => {
                    videosData.push([
                        v.videoName || v.name || 'Untitled',
                        v.product || 'N/A',
                        v.videoType || 'N/A',
                        v.videoTalent || 'N/A',
                        v.shootDay || v.shootDate || 'N/A',
                        v.shootStatus || 'Pending',
                        v.projectName || 'N/A',
                        v.clientName || 'N/A',
                        v.scriptDocsLink || v.scriptLink || 'N/A',
                        v.storyboardLink || 'N/A',
                        v.specialNotes || ''
                    ]);
                });
                const videosSheet = XLSX.utils.aoa_to_sheet(videosData);
                videosSheet['!cols'] = [
                    { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
                    { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 40 }, { wch: 40 }, { wch: 40 }
                ];
                XLSX.utils.book_append_sheet(wb, videosSheet, 'Videos');
            }

            // Scripts Sheet - COMPREHENSIVE
            if (monthlyData.scripts.all.length > 0) {
                const scriptsData = [
                    ['SCRIPT DETAILS - COMPREHENSIVE REPORT'],
                    [],
                    ['Script Name', 'Client', 'Content Type', 'Status', 'Script Link', 'Video Name', 'Assigned Video', 'Created Date', 'Notes']
                ];
                monthlyData.scripts.all.forEach(s => {
                    scriptsData.push([
                        s.scriptName || s.title || 'Untitled',
                        s.clientName || 'N/A',
                        s.contentType || 'N/A',
                        s.status || 'Draft',
                        s.scriptLink || 'N/A',
                        s.videoName || 'N/A',
                        s.assignedVideo || 'N/A',
                        s.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
                        s.notes || s.specialNotes || ''
                    ]);
                });
                const scriptsSheet = XLSX.utils.aoa_to_sheet(scriptsData);
                scriptsSheet['!cols'] = [
                    { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 40 },
                    { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }
                ];
                XLSX.utils.book_append_sheet(wb, scriptsSheet, 'Scripts');
            }

            // Post-Productions Sheet - COMPREHENSIVE
            if (monthlyData.postProductions.all.length > 0) {
                const ppData = [
                    ['POST-PRODUCTION DETAILS - COMPREHENSIVE REPORT'],
                    [],
                    ['Video Name', 'Editor', 'Status', 'Priority', 'Project', 'Client', 'Deadline', 'Delivery Date', 'Drive Link', 'Notes']
                ];
                monthlyData.postProductions.all.forEach(pp => {
                    ppData.push([
                        pp.videoName || pp.title || 'Untitled',
                        pp.editor || 'N/A',
                        pp.status || 'N/A',
                        pp.priority || 'Normal',
                        pp.projectName || 'N/A',
                        pp.clientName || 'N/A',
                        pp.deadline || 'N/A',
                        pp.deliveryDate || 'N/A',
                        pp.driveLink || pp.projectDriveLink || 'N/A',
                        pp.notes || pp.specialNotes || ''
                    ]);
                });
                const ppSheet = XLSX.utils.aoa_to_sheet(ppData);
                ppSheet['!cols'] = [
                    { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 25 },
                    { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 40 }
                ];
                XLSX.utils.book_append_sheet(wb, ppSheet, 'Post-Productions');
            }

            // Generate Excel file as blob and download
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const blobUrl = URL.createObjectURL(blob);

            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 100);

            setDownloadSuccess(true);
            console.log(`✅ Excel Report saved: ${fileName}`);

            setTimeout(() => {
                setDownloadSuccess(false);
            }, 5000);

        } catch (error) {
            console.error('Error generating Excel:', error);
            alert(`Failed to generate Excel report: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setGenerating(false);
        }
    };

    // Combined download handler
    const handleDownload = () => {
        if (selectedFormat === 'pdf') {
            generatePDF();
        } else {
            generateExcel();
        }
    };

    // Check if it's report day (30th)
    const isReportDay = new Date().getDate() >= 28;

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <FileText size={32} color="var(--accent-color)" />
                        Monthly Reports
                    </h1>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        Generate and download comprehensive monthly reports
                    </p>
                </div>
            </div>

            {/* Report Day Banner */}
            {isReportDay && (
                <div className="report-banner">
                    <div className="report-banner-content">
                        <AlertCircle size={24} />
                        <div>
                            <strong>Report Time!</strong>
                            <span>It's the end of the month. Generate your monthly report now!</span>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={generatePDF} disabled={generating || isLoading}>
                        {generating ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
                        Download Report
                    </button>
                </div>
            )}

            {/* Month Selector */}
            <div className="report-month-selector">
                <button className="report-nav-btn" onClick={prevMonth}>
                    <ChevronLeft size={20} />
                </button>
                <div className="report-month-display">
                    <Calendar size={20} />
                    <span>{getMonthName(selectedMonth.month)} {selectedMonth.year}</span>
                </div>
                <button className="report-nav-btn" onClick={nextMonth}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {isLoading ? (
                <div className="report-loading">
                    <Loader2 size={48} className="spin" />
                    <p>Loading report data...</p>
                </div>
            ) : (
                <>
                    {/* Overall Summary */}
                    <div className="report-summary-card">
                        <div className="report-summary-header">
                            <TrendingUp size={24} />
                            <h2>Monthly Summary</h2>
                        </div>
                        <div className="report-summary-stats">
                            <div className="report-summary-stat">
                                <span className="report-stat-value">{overallStats.totalItems}</span>
                                <span className="report-stat-label">Total Items</span>
                            </div>
                            <div className="report-summary-stat">
                                <span className="report-stat-value">{overallStats.totalCompleted}</span>
                                <span className="report-stat-label">Completed</span>
                            </div>
                            <div className="report-summary-stat">
                                <span className="report-stat-value" style={{ color: overallStats.completionRate >= 50 ? 'var(--success)' : 'var(--warning)' }}>
                                    {overallStats.completionRate}%
                                </span>
                                <span className="report-stat-label">Completion Rate</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Cards */}
                    <div className="report-cards-grid">
                        {/* Projects Card */}
                        <div className="report-card report-card-blue">
                            <div className="report-card-header">
                                <FolderGit2 size={24} />
                                <h3>Projects</h3>
                            </div>
                            <div className="report-card-stats">
                                <div className="report-card-stat">
                                    <span className="report-card-value">{monthlyData.projects.total}</span>
                                    <span className="report-card-label">Total</span>
                                </div>
                                <div className="report-card-breakdown">
                                    <div className="report-breakdown-item">
                                        <CheckCircle2 size={16} color="var(--success)" />
                                        <span>{monthlyData.projects.completed} Completed</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <Clock size={16} color="var(--accent-color)" />
                                        <span>{monthlyData.projects.inProgress} In Progress</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <AlertCircle size={16} color="var(--warning)" />
                                        <span>{monthlyData.projects.onHold} On Hold</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Videos Card */}
                        <div className="report-card report-card-purple">
                            <div className="report-card-header">
                                <Film size={24} />
                                <h3>Videos</h3>
                            </div>
                            <div className="report-card-stats">
                                <div className="report-card-stat">
                                    <span className="report-card-value">{monthlyData.videos.total}</span>
                                    <span className="report-card-label">Total</span>
                                </div>
                                <div className="report-card-breakdown">
                                    <div className="report-breakdown-item">
                                        <CheckCircle2 size={16} color="var(--success)" />
                                        <span>{monthlyData.videos.completed} Completed</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <Calendar size={16} color="var(--accent-color)" />
                                        <span>{monthlyData.videos.scheduled} Scheduled</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <Clock size={16} color="var(--warning)" />
                                        <span>{monthlyData.videos.pending} Pending</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scripts Card */}
                        <div className="report-card report-card-green">
                            <div className="report-card-header">
                                <FileSpreadsheet size={24} />
                                <h3>Scripts</h3>
                            </div>
                            <div className="report-card-stats">
                                <div className="report-card-stat">
                                    <span className="report-card-value">{monthlyData.scripts.total}</span>
                                    <span className="report-card-label">Total</span>
                                </div>
                                <div className="report-card-breakdown">
                                    <div className="report-breakdown-item">
                                        <CheckCircle2 size={16} color="var(--success)" />
                                        <span>{monthlyData.scripts.approved} Approved</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <RefreshCw size={16} color="var(--accent-color)" />
                                        <span>{monthlyData.scripts.inReview} In Review</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <FileText size={16} color="var(--text-secondary)" />
                                        <span>{monthlyData.scripts.draft} Draft</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Post-Productions Card */}
                        <div className="report-card report-card-orange">
                            <div className="report-card-header">
                                <Video size={24} />
                                <h3>Post-Productions</h3>
                            </div>
                            <div className="report-card-stats">
                                <div className="report-card-stat">
                                    <span className="report-card-value">{monthlyData.postProductions.total}</span>
                                    <span className="report-card-label">Total</span>
                                </div>
                                <div className="report-card-breakdown">
                                    <div className="report-breakdown-item">
                                        <CheckCircle2 size={16} color="var(--success)" />
                                        <span>{monthlyData.postProductions.completed} Completed</span>
                                    </div>
                                    <div className="report-breakdown-item">
                                        <Clock size={16} color="var(--accent-color)" />
                                        <span>{monthlyData.postProductions.inProgress} In Progress</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Download Section */}
                    <div className="report-download-section">
                        {/* Format Selector */}
                        <div className="report-format-selector">
                            <span className="report-format-label">Select Format:</span>
                            <div className="report-format-options">
                                <button
                                    className={`report-format-btn ${selectedFormat === 'pdf' ? 'active' : ''}`}
                                    onClick={() => setSelectedFormat('pdf')}
                                >
                                    <FileDown size={18} />
                                    PDF
                                </button>
                                <button
                                    className={`report-format-btn ${selectedFormat === 'excel' ? 'active' : ''}`}
                                    onClick={() => setSelectedFormat('excel')}
                                >
                                    <Table2 size={18} />
                                    Excel
                                </button>
                            </div>
                        </div>

                        {/* Download Button */}
                        <button
                            className="btn btn-primary report-download-btn"
                            onClick={handleDownload}
                            disabled={generating || isLoading}
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={20} className="spin" />
                                    Generating {selectedFormat.toUpperCase()} Report...
                                </>
                            ) : downloadSuccess ? (
                                <>
                                    <Check size={20} />
                                    Report Downloaded!
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    Download {selectedFormat.toUpperCase()} Report
                                </>
                            )}
                        </button>

                        {/* Success Notification */}
                        {downloadSuccess && (
                            <div className="report-success-toast">
                                <CheckCircle2 size={20} color="var(--success)" />
                                <span>{selectedFormat.toUpperCase()} Report saved successfully! Check your Downloads folder.</span>
                            </div>
                        )}

                        <p className="report-download-hint">
                            Generate a comprehensive {selectedFormat.toUpperCase()} report for {getMonthName(selectedMonth.month)} {selectedMonth.year}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
