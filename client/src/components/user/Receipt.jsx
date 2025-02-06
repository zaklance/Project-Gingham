import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer, Document, Image, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import { convertToLocalDate } from "../../utils/helpers";

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica', color: "#ff806b", backgroundColor: '#fbf7eb' },
    header: { fontSize: 18, textAlign: "center", marginBottom: 0 },
    image: { margin: "0 auto", height: "80px", width: "80px" },
    section: { marginBottom: 20 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    rowItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    bold: { fontWeight: "bold" },
    divider: { borderBottom: "1px solid black", marginVertical: 5 },
    tableHeader: { flexDirection: "row", borderBottom: "1px solid black", paddingBottom: 5, marginBottom: 5 },
    tableRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    tableColumn: { width: "25%" },
    totalRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
});

const ReceiptDocument = ({ receipt }) => {
    console.log("Receipt Data:", receipt);

    // Ensure `baskets` is always an array
    let basketItems = [];
    try {
        basketItems = Array.isArray(receipt?.baskets) ? receipt.baskets : JSON.parse(receipt.baskets);
    } catch (error) {
        console.error("❌ Error parsing baskets:", error);
    }

    console.log("Basket Items:", basketItems);

    //Ensure `totalPrice` is always defined
    const totalPrice = basketItems.reduce((acc, item) => acc + (item.price || 0), 0).toFixed(2);

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Image style={styles.image} src="/site-images/gingham-logo-A_3.png" />
                <View style={styles.divider} />

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Receipt ID:</Text> {receipt.id}</Text>
                        <Text>
                            {receipt.user?.first_name || "N/A"} {receipt.user?.last_name || ""}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Purchase Date:</Text> {convertToLocalDate(receipt.created_at)}</Text>
                        <Text>
                            {receipt.user?.address_1 || "N/A"}{receipt.user?.address_2 ? `, ${receipt.user.address_2}` : ""}
                        </Text>
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

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.bold, styles.tableColumn]}>Market</Text>
                    <Text style={[styles.bold, styles.tableColumn]}>Vendor</Text>
                    <Text style={[styles.bold, styles.tableColumn]}>Item ID</Text>
                    <Text style={[styles.bold, styles.tableColumn]}>Price</Text>
                </View>

                {/* Table Data */}
                {basketItems.length > 0 ? (
                    basketItems.map((item, index) => (
                        <View key={index}>
                            <View style={styles.row}>
                                <Text>Basket ID: {item.id}</Text>
                                <Text>Vendor: {item.vendor_name || "N/A"}</Text>
                                <Text>Price: ${item.price ? item.price.toFixed(2) : "N/A"}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text>Pickup Date: {item.sale_date || "N/A"}</Text>
                                <Text>Pickup Start: {item.pickup_start || "N/A"}</Text>
                                <Text>Pickup End: {item.pickup_end || "N/A"}</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text>No items found in receipt.</Text>
                )}

                <View style={styles.divider} />

                {/* Total Amount */}
                <View style={styles.totalRow}>
                    <Text style={styles.bold}>Total:</Text>
                    <Text style={styles.bold}>${totalPrice}</Text>
                </View>
            </Page>
        </Document>
    );
};

const ReceiptPdf = () => {
    const { id } = useParams();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) {
            setError("Invalid receipt ID.");
            setLoading(false);
            return;
        }

        fetch(`/api/receipts/${id}`)
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
    }, [id]);

    if (loading) return <p>Loading receipt...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
    if (!receipt) return <p>No receipt found.</p>;

    return (
        <div>
            <h2 className="text-center">Receipt Preview</h2>
            
            {/* Inline PDF Viewer */}
            <PDFViewer style={{ width: '100%', height: '600px' }}>
                <ReceiptDocument receipt={receipt} />
            </PDFViewer>

            {/* Download Button */}
            <div className="text-center margin-t-20">
                <PDFDownloadLink 
                    document={<ReceiptDocument receipt={receipt} />} 
                    fileName={`receipt_${receipt.id}.pdf`}
                    className="btn btn-add"
                >
                    {({ loading }) => (loading ? "Preparing download..." : "Download PDF")}
                </PDFDownloadLink>
            </div>
        </div>
    );
};

export default ReceiptPdf;