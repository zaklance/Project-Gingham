import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer, Document, Image, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import { formatBasketDate, convertToLocalDate, timeConverter, receiptDateConverter } from "../../utils/helpers";
import { months } from "../../utils/common";

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica', color: "#3b4752", backgroundColor: '#fbf7eb' },
    header: { fontSize: 18, textAlign: "center", marginBottom: 0 },
    image: { margin: "0 auto", height: "80px", width: "80px" },
    section: { marginBottom: 20 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    rowItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    rowFooter: { flexDirection: "row", justifyContent: "space-between", gap: 172 },
    bold: { fontFamily: "Helvetica-Bold", fontWeight: "bold" },
    divider: { borderBottom: "2px solid #3b4752", marginVertical: 4 },
    footer: { position: "absolute", bottom: 24 },
});

const ReceiptDocument = ({ filteredBaskets, year, month }) => {

    return (
        <Document>
            <Page size="LETTER" style={styles.page} wrap={true}>
                <View fixed>
                    <Image style={styles.image} src="/site-images/gingham-logo_04-2A.png"></Image>
                    <View style={styles.divider} />
                </View>
                {/* <Text style={styles.header}>Receipt</Text> */}
                
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Monthly Statement:</Text> {year} {months[parseInt(month) - 1]}</Text>
                        <Text><Text style={styles.bold}>Vendor ID:</Text> {filteredBaskets[0].vendor?.id}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text></Text>
                        <Text>{filteredBaskets[0]?.vendor?.name || "N/A"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text></Text>
                        <Text>{filteredBaskets[0].vendor?.city}, {filteredBaskets[0].vendor?.state}</Text>
                    </View>
                </View>

                <Text style={styles.bold}>Items Purchased:</Text>
                <View style={styles.divider} />

                {/* Prevent mapping error by ensuring `basketItems` is always an array */}
                {filteredBaskets.length > 0 && (
                    filteredBaskets.map((item, index) => (
                        <View key={index} wrap={false}>
                            <View style={styles.row}>
                                <Text>Basket ID: {item.id}</Text>
                                <Text>{item.market_day.market.name}</Text>
                                <Text>{formatBasketDate(item.sale_date)}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text>Grabbed: {item.is_grabbed ? 'Yes' : 'No'}</Text>
                                <Text>Price: ${item.price.toFixed(2)}</Text>
                                <Text>Fee: ${item.fee_vendor.toFixed(2)}</Text>
                                <Text>Payout: ${item.is_refunded ? 'Refunded' : item.price - item.fee_vendor.toFixed(2)}</Text>
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.divider} />

                <Text style={[styles.bold, styles.row]}>
                    <Text>Total Payout: </Text>
                    <Text>
                        ${filteredBaskets
                            .reduce((acc, item) => acc + (item.is_refunded ? 0 : item.price - item.fee_vendor), 0)
                            .toFixed(2)}
                    </Text>                </Text>
                <View style={styles.footer} fixed>
                    <View style={styles.rowFooter}>
                        <Text style={styles.bold}>Gingham 2025 &copy;</Text>
                        <Text style={styles.bold} render={({ pageNumber }) => (`${pageNumber}`)}></Text>
                        <Text style={styles.bold}>www.gingham.nyc</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

const VendorPDFMonthlyBaskets = ({ monthlyBaskets, year, month, vendorId }) => {
    const [filteredBaskets, setFilteredBaskets] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('vendor_jwt-token');


    useEffect(() => {
        if (year && month) {
            try {
                fetch(`/api/export-pdf/for-vendor/baskets?vendor_id=${vendorId}&year=${year}&month=${month}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        const filteredData = data.filter(basket => basket.is_sold === true);
                        setFilteredBaskets(filteredData);
                        setLoading(false)
                    })
                    .catch(error => console.error('Error fetching baskets', error));
            } catch {

            }
        }
    }, [year, month]);

    if (loading) return <p>Loading receipt...</p>;
    // if (error) return <p style={{ color: "#ff4b5a" }}>Error: {error}</p>;;

    return (
        <>
            <PDFDownloadLink
                document={<ReceiptDocument filteredBaskets={filteredBaskets} year={year} month={month} />}
                fileName={`gingham_vendor-statement_${year}-${month.padStart(2, '0')}.pdf`}
                className="btn btn-file"
            >
                {({ loading }) => (loading ? "Preparing..." : "Download PDF")}
            </PDFDownloadLink>
        </>
    );
};

export default VendorPDFMonthlyBaskets;