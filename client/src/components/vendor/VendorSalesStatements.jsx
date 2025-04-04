import React, { useEffect, useState } from 'react';
import { months } from '../../utils/common.js'
import VendorPDFMonthlyBaskets from './VendorPDFMonthlyBaskets.jsx';
import PulseLoader from 'react-spinners/PulseLoader';

function VendorSalesStatements({ baskets, vendorId }) {
	const [monthlyBaskets, setMonthlyBaskets] = useState({});
	const [openDetail, setOpenDetail] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState('');


	const downloadCSV = async (year, month) => {
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
			setIsExporting(true);
			setExportProgress('Processing your CSV...');

			// Step 2: Poll for task completion
			const checkTaskStatus = async () => {
				const statusResponse = await fetch(`/api/export-csv/vendor-baskets/status/${taskId}`);
				const statusData = await statusResponse.json();

				if (statusData.status === 'completed') {
					setExportProgress('Download starting...');
					// Start the download
					window.location.href = statusData.download_url;
					setIsExporting(false);
					return true;
				} else if (statusData.status === 'failed') {
					setExportProgress('Export failed: ' + statusData.error);
					setIsExporting(false);
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
			setIsExporting(false);
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
	}, [monthlyBaskets]);
	

	return (
		<>
			<title>Gingham • Vendor Statements</title>
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
													<VendorPDFMonthlyBaskets monthlyBaskets={monthlyBaskets} year={year} month={month} vendorId={vendorId} />
													{isExporting ? (
														<PulseLoader
															className='margin-t-12 margin-l-40'
															color={'#ff806b'}
															size={10}
															aria-label="Loading Spinner"
															data-testid="loader"
														/>
													) : (
														<button
															onClick={() => downloadCSV(year, month)}
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