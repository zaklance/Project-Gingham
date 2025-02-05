import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PDFViewer, Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
    header: { fontSize: 18, textAlign: "center", marginBottom: 20 },
    section: { marginBottom: 10 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    bold: { fontWeight: "bold" },
    divider: { borderBottom: "1px solid black", marginVertical: 5 },
});

const ReceiptDocument = ({ receipt }) => {
    console.log("Receipt Data:", receipt); // ✅ Debugging: Check fetched data in console

    const basketItems = Array.isArray(receipt?.baskets) ? receipt.baskets : []; // ✅ Ensure it's always an array

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>Purchase Receipt</Text>
                
                <View style={styles.section}>
                    <Text><Text style={styles.bold}>Receipt ID:</Text> {receipt.id}</Text>
                    <Text><Text style={styles.bold}>User ID:</Text> {receipt.user_id}</Text>
                    <Text><Text style={styles.bold}>Date:</Text> {new Date(receipt.created_at).toLocaleString()}</Text>
                </View>

                <Text style={styles.bold}>Items Purchased:</Text>
                <View style={styles.divider} />

                {/* ✅ Prevent mapping error by ensuring `basketItems` is always an array */}
                {basketItems.length > 0 ? (
                    basketItems.map((item, index) => (
                        <View key={index} style={styles.row}>
                            <Text>Item ID: {item.id}</Text>
                            <Text>Vendor ID: {item.vendor_id}</Text>
                            <Text>Price: ${item.price.toFixed(2)}</Text>
                        </View>
                    ))
                ) : (
                    <Text>No items found in receipt.</Text>
                )}

                <View style={styles.divider} />

                <Text style={[styles.bold, styles.row]}>
                    <Text>Total:</Text>
                    <Text>${basketItems.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</Text>
                </Text>
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

        fetch(`/api/receipt/${id}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched Receipt Data:", data); // ✅ Debugging: Log fetched data
                if (data.error) {
                    setError(data.error);
                } else {
                    setReceipt(data);
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load receipt.");
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