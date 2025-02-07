import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer, Document, Image, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import { formatBasketDate, timeConverter, receiptDateConverter } from "../../utils/helpers";

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica', color: "#3b4752", backgroundColor: '#fbf7eb' },
    header: { fontSize: 18, textAlign: "center", marginBottom: 0 },
    image: { margin: "0 auto", height: "80px", width: "80px" },
    section: { marginBottom: 20 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    rowItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    rowFooter: { flexDirection: "row", justifyContent: "space-between", gap: 360 },
    bold: { fontFamily: "Helvetica-Bold", fontWeight: "bold" },
    divider: { borderBottom: "2px solid #3b4752", marginVertical: 4 },
    footer: { position: "absolute", bottom: 30 },
});

const ReceiptDocument = ({ receipt, page }) => {
    // console.log("Receipt Data:", receipt); // ✅ Debugging: Check fetched data in console
    
    const basketItems = Array.isArray(receipt?.baskets) ? receipt.baskets : []; // ✅ Ensure it's always an array

    return (
        <Document>
            <Page size="LETTER" style={styles.page} wrap={true}>
                <View fixed>
                    <Image style={styles.image} src="/site-images/gingham-logo-A_2.png"></Image>
                    <View style={styles.divider} />
                </View>
                {/* <Text style={styles.header}>Receipt</Text> */}
                
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Receipt ID:</Text> {receipt.id}</Text>
                        <Text>
                            {receipt.user?.first_name || "N/A"} {receipt.user?.last_name || ""}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Purchase Date:</Text> {receiptDateConverter(receipt.created_at)}</Text>
                        <Text>{receipt.user.address_1}{receipt.user.address_2 && ", "}{receipt.user.address_2}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>&emsp;</Text>
                        <Text>
                            {receipt.user?.city || "N/A"}, {receipt.user?.state || "N/A"} {receipt.user?.zipcode || "N/A"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.bold}>Items Purchased:</Text>
                <View style={styles.divider} />

                {/* ✅ Prevent mapping error by ensuring `basketItems` is always an array */}
                {basketItems.length > 0 && (
                    basketItems.map((item, index) => (
                        <View key={index}>
                            <View style={styles.row}>
                                <Text>Basket ID: {item.id}</Text>
                                <Text>Pickup Date: {receiptDateConverter(item.sale_date)}</Text>
                                <Text>Pickup Time: {timeConverter(item.pickup_start)} - {timeConverter(item.pickup_end)}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text>Price: ${item.price.toFixed(2)}</Text>
                                <Text>{item.vendor_name}</Text>
                                <Text>{item.market_location}</Text>
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.divider} />

                <Text style={[styles.bold, styles.row]}>
                    <Text>Total: </Text>
                    <Text>${basketItems.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</Text>
                </Text>
                <View style={styles.footer}>
                    <View style={styles.rowFooter}>
                        <Text style={styles.bold}>Gingham 2025 &copy;</Text>
                        <Text style={styles.bold}>www.gingham.nyc</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

const Receipt = ({ receiptId, page }) => {
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!receiptId) {
            setError("Invalid receipt ID.");
            setLoading(false);
            return;
        }

        fetch(`/api/receipts/${receiptId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched Receipt Data:", data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setReceipt(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch receipt:", err);
                setLoading(false);
            });
    }, [receiptId]);

    if (loading) return <p>Loading receipt...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
    if (!receipt) return <p>No receipt found.</p>;

    return (
        <>
            {/* <h2 className="text-center">Receipt Preview</h2>
            <PDFViewer style={{ width: '100%', height: '600px' }}>
                <ReceiptDocument receipt={receipt} />
            </PDFViewer> */}
            {page === 'checkout' && (
                <div className="text-center">
                    <PDFDownloadLink 
                        document={<ReceiptDocument receipt={receipt} />} 
                        fileName={`receipt_${receipt.id}.pdf`}
                        className="btn btn-add"
                    >
                        {({ loading }) => (loading ? "Preparing download..." : "Download Receipt")}
                    </PDFDownloadLink>
                </div>
            )}
            {page === 'profile' && (
                <PDFDownloadLink
                    document={<ReceiptDocument receipt={receipt} />}
                    fileName={`receipt_${receipt.id}.pdf`}
                    className="icon-file"
                >                        
                    &emsp;
                </PDFDownloadLink>
            )}
        </>
    );
};

export default Receipt;