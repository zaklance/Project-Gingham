import React, { useEffect, useState } from 'react';
import { months } from "@repo/ui/common.js";
import PulseLoader from 'react-spinners/PulseLoader.js';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import ReceiptDocument from './VendorPDFMonthlyBaskets.jsx'

function VendorSalesStatements({ baskets, vendorId }) {
	const [monthlyBaskets, setMonthlyBaskets] = useState({});
	const [openDetail, setOpenDetail] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isExporting, setIsExporting] = useState({});
	const [exportProgress, setExportProgress] = useState('');
	const [isPreparing, setIsPreparing] = useState({});

	const downloadCSV = async (year, month, monthKey) => {
		setIsExporting(prev => ({ ...prev, [monthKey]: true }))
		try {
			// Step 1: Queue the CSV generation task
			const response = await fetch('/api/export-csv/vendor-baskets/baskets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					vendor_id: vendorId,
					year: year,
					month: month
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to start CSV generation');
			}

			const data = await response.json();
			const taskId = data.task_id;

			// Set up state to track download progress
			setExportProgress('Processing your CSV...');

			// Step 2: Poll for task completion
			const checkTaskStatus = async () => {
				const statusResponse = await fetch(`/api/export-csv/vendor-baskets/status/${taskId}`);
				const statusData = await statusResponse.json();

				if (statusData.status === 'completed') {
					setExportProgress('Download starting...');
					// Start the download
					window.location.href = statusData.download_url;
					setIsExporting(prev => ({ ...prev, [monthKey]: false }))
					return true;
				} else if (statusData.status === 'failed') {
					setExportProgress('Export failed: ' + statusData.error);
					setIsExporting(prev => ({ ...prev, [monthKey]: false }))
					return true;
				} else {
					// Still processing
					return false;
				}
			};

			// Poll every 2 seconds until complete
			const pollInterval = setInterval(async () => {
				const isDone = await checkTaskStatus();
				if (isDone) {
					clearInterval(pollInterval);
				}
			}, 2000);

		} catch (error) {
			console.error('Error exporting CSV:', error);
			setExportProgress('Export failed: ' + error.message);
			setIsExporting(prev => ({ ...prev, [monthKey]: false }))
		}
	};


	const handleToggle = (name) => {
		setOpenDetail((prev) => (prev === name ? null : name));
	};

	useEffect(() => {
		organizeByMonth(baskets);
	}, [baskets]);

	const organizeByMonth = (baskets) => {
		const monthlyData = {};
		baskets.forEach(basket => {
			if (basket.sale_date) {
				const date = new Date(basket.sale_date);
				const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
				if (!monthlyData[key]) {
					monthlyData[key] = [];
				}
				monthlyData[key].push(basket);
			}
		});
		setMonthlyBaskets(monthlyData);
	};

	useEffect(() => {
		const sortedYears = Object.entries(
			Object.keys(monthlyBaskets)
				.map(monthKey => {
					const [year, month] = monthKey.split('-');
					return { year, month, monthKey, count: monthlyBaskets[monthKey].length };
				})
				.sort((a, b) => {
					return b.year - a.year || a.month - b.month;
				})
				.reduce((years, { year, month, monthKey, count }) => {
					if (!years[year]) {
						years[year] = [];
					}
					years[year].push({ month, monthKey, count });
					return years;
				}, {})
		).sort(([yearA], [yearB]) => yearB - yearA);

		setTimeout(() => {
			setOpenDetail(sortedYears.length > 0 ? sortedYears[0][0] : null)
			setLoading(false)
		}, 400);
		
		const keys = Object.keys(monthlyBaskets);
		setIsPreparing(prev => {
			const newState = { ...prev };
			keys.forEach(monthKey => {
				if (!(monthKey in newState)) {
					newState[monthKey] = false;
				}
			});
			return newState;
		});
	}, [monthlyBaskets]);

	async function generateAndDownloadPDF(document, fileName) {
		const blob = await pdf(document).toBlob();
		saveAs(blob, fileName);
	}

	async function handleDownloadPDF(monthKey, year, month) {
		if (!vendorId) return null
		setIsPreparing(prev => ({ ...prev, [monthKey]: true }))

		try {
			const token = localStorage.getItem('vendor_jwt-token');
			const response = await fetch(`/api/export-pdf/for-vendor/baskets?vendor_id=${vendorId}&year=${year}&month=${month}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			const data = await response.json();
			const filteredBaskets = data.filter(basket => basket.is_sold);

			const doc = (
				<ReceiptDocument
					filteredBaskets={filteredBaskets}
					year={year}
					month={month}
				/>
			);

			const fileName = `gingham_vendor-statement_${year}-${month.padStart(2, '0')}.pdf`;

			await generateAndDownloadPDF(doc, fileName);

		} catch (error) {
			console.error("Error preparing PDF:", error);
			setIsPreparing(prev => ({ ...prev, [monthKey]: false }))
		} finally {
			setIsExporting(false);
			setIsPreparing(prev => ({ ...prev, [monthKey]: false }))
		}
	}
	

	return (
		<>
			<title>gingham • Vendor Statements</title>
			{baskets && !loading && (
				<div id="statements" className='box-bounding box-scroll'>
					<h2 className='margin-b-16'>Monthly Statements</h2>
					{Object.entries(
						Object.keys(monthlyBaskets)
							.map(monthKey => {
								const [year, month] = monthKey.split('-');
								return { year, month, monthKey, count: monthlyBaskets[monthKey].length };
							})
							.sort((a, b) => {
								return b.year - a.year || a.month - b.month;
							})
							.reduce((years, { year, month, monthKey, count }) => {
								if (!years[year]) {
									years[year] = [];
								}
								years[year].push({ month, monthKey, count });
								return years;
							}, {})
						).sort(([yearA], [yearB]) => yearB - yearA)
						.map(([year, monthsInYear]) => (
							<details 
								key={year} 
								className='details-basket-sales'
								open={openDetail === year}
							>
								<summary 
									className="text-500"
									onClick={(e) => {
										e.preventDefault();
										handleToggle(year);
									}}
								>{year}</summary>
								<div className="grid-3">
									{monthsInYear.sort((a, b) => {
										const monthA = parseInt(a.month, 10);
										const monthB = parseInt(b.month, 10);
										return monthB - monthA;
									}).map(monthData => {
										const month = monthData.month;
										const monthKey = monthData.monthKey;
										const count = monthlyBaskets[monthKey].length;
										return (
											<div 
												key={monthKey} 
												className="flex-start flex-center-align"
												style={{ display: (new Date().getFullYear() === parseInt(year) && new Date().getMonth() === parseInt(month) 
													&& new Date().getDate() > 9) || (new Date().getFullYear() > parseInt(year) || (new Date().getFullYear() === parseInt(year)
													&& new Date().getMonth() > parseInt(month))) ? 'flex' : 'none' }}
											>
												<div>
													<p className='text-500'>{months[parseInt(month) - 1]} {year} &emsp;</p>
													<p>Baskets: {count}</p>
												</div>
												<div className='flex-column flex-space-between'>
													{isPreparing[monthKey] ? (
														<PulseLoader
															className='margin-t-12 margin-l-40'
															color={'#ff806b'}
															size={10}
															aria-label="Loading Spinner"
															data-testid="loader"
														/>
													) : (
														<button
																	className="btn btn-file"
																	onClick={() => handleDownloadPDF(monthKey, year, month)}
														>
																	Download PDF
														</button>
													)}
													{isExporting[monthKey] ? (
														<PulseLoader
															className='margin-t-12 margin-l-40'
															color={'#ff806b'}
															size={10}
															aria-label="Loading Spinner"
															data-testid="loader"
														/>
													) : (
														<button
															onClick={() => downloadCSV(year, month, monthKey)}
															className="btn btn-file"
														>
															Download CSV
														</button>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</details>
					))}
				</div>
			)}
		</>
	);
}

export default VendorSalesStatements;