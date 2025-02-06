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
    divider: { borderBottom: "2px solid #ff806b", marginVertical: 5 },
});


const ReceiptDocument = ({ receipt }) => {
    console.log("Receipt Data:", receipt); // ✅ Debugging: Check fetched data in console
    
    const basketItems = Array.isArray(receipt?.baskets) ? receipt.baskets : []; // ✅ Ensure it's always an array
    console.log(basketItems)
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <Image style={styles.image} src="/site-images/gingham-logo-A_3.png"></Image>
                <View style={styles.divider} />
                {/* <Text style={styles.header}>Receipt</Text> */}
                
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Receipt ID:</Text> {receipt.id}</Text>
                        <Text>{receipt.user.first_name} {receipt.user.last_name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Purchase Date:</Text> {convertToLocalDate(receipt.created_at)}</Text>
                        <Text>{receipt.user.address_1}{receipt.user.address_2 && ", "}{receipt.user.address_2}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text>&emsp;</Text>
                        <Text>{receipt.user.city}, {receipt.user.state} {receipt.user.zipcode}</Text>
                    </View>
                </View>

                <Text style={styles.bold}>Items Purchased:</Text>
                <View style={styles.divider} />

                {/* ✅ Prevent mapping error by ensuring `basketItems` is always an array */}
                {basketItems.length > 0 ? (
                    basketItems.map((item, index) => (
                        <View key={index}>
                            <View style={styles.row}>
                                <Text>Basket ID: {item.id}</Text>
                                <Text>Vendor ID: {item.vendor_name}</Text>
                                <Text>Price: ${item.price.toFixed(2)}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Text>Pickup Date: {item.sale_date}</Text>
                                <Text>Pickup Start: {item.pickup_start}</Text>
                                <Text>Pickup End: {item.pickup_end}</Text>
                            </View>
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

        fetch(`/api/receipts/${id}`)
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