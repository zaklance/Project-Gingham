import React, { useState, useEffect } from "react";
import { PDFDownloadLink, Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBasketDate, timeConverter, receiptDateConverter, fileTimeConverter } from "../../utils/helpers";

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: "Helvetica", color: "#3b4752", backgroundColor: "#fbf7eb" },
    header: { fontSize: 18, textAlign: "center", marginBottom: 0 },
    image: { margin: "0 auto", height: "80px", width: "80px" },
    section: { marginBottom: 20 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    rowItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    rowFooter: { flexDirection: "row", justifyContent: "space-between", gap: 172 },
    rowStart: { flexDirection: "row", width: "100%" },
    total: { width: "75" },
    bold: { fontFamily: "Helvetica-Bold", fontWeight: "bold" },
    divider: { borderBottom: "2px solid #3b4752", marginVertical: 4 },
    footer: { position: "absolute", bottom: 24 },
});

const ReceiptDocument = ({ receipt, transaction }) => {
    const basketItems = Array.isArray(receipt?.baskets) ? receipt.baskets : [];

    return (
        <Document>
            <Page size="LETTER" style={styles.page} wrap={true}>
                <View fixed>
                    <Image style={styles.image} src="/site-images/gingham-logo-A_2.png"></Image>
                    <View style={styles.divider} />
                </View>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Receipt ID:</Text> {receipt.id}</Text>
                        <Text>{receipt.user?.first_name || "N/A"} {receipt.user?.last_name || ""}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Purchase Date:</Text> {receiptDateConverter(receipt.created_at)}</Text>
                        <Text>{receipt.user.address_1}{receipt.user.address_2 && ", "}{receipt.user.address_2}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text><Text style={styles.bold}>Card:</Text> {`**** **** **** ${transaction?.card_id}` || "N/A"}</Text>
                        <Text>{receipt.user?.city || "N/A"}, {receipt.user?.state || "N/A"} {receipt.user?.zipcode || "N/A"}</Text>
                    </View>
                </View>

                <Text style={styles.bold}>Items Purchased:</Text>
                <View style={styles.divider} />

                {basketItems.map((item, index) => (
                    <View key={index} wrap={false}>
                        <View style={styles.row}>
                            <Text>Basket ID: {item.id}</Text>
                            <Text>{item.vendor_name}</Text>
                            <Text>{item.market_location}</Text>
                        </View>
                        <View style={styles.rowItem}>
                            <Text>Price: ${item.price.toFixed(2)} &emsp; Fee: $ {item.fee_user.toFixed(2)}</Text>
                            <Text>Pickup Date: {formatBasketDate(item.sale_date)}</Text>
                            <Text>Pickup Time: {timeConverter(item.pickup_start)} - {timeConverter(item.pickup_end)}</Text>
                        </View>
                    </View>
                ))}

                <View wrap={false}>
                    <View style={styles.divider} />
                    <View style={styles.rowStart}>
                        <Text style={styles.total}>Total Price:</Text>
                        <Text>${basketItems.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.rowStart}>
                        <Text style={styles.total}>Total Fee:</Text>
                        <Text>${basketItems.reduce((acc, item) => acc + item.fee_user, 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.rowStart}>
                        <Text style={styles.total}>Total Tax:</Text>
                        <Text>${transaction?.tax.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.rowStart, styles.bold]}>
                        <Text style={styles.total}>Sum Total:</Text>
                        <Text>${basketItems.reduce((acc, item) => acc + (item.price + item.fee_user), 0).toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.footer} fixed>
                    <View style={styles.rowFooter}>
                        <Text style={styles.bold}>Gingham 2025 &copy;</Text>
                        <Text style={styles.bold} render={({ pageNumber }) => `${pageNumber}`}></Text>
                        <Text style={styles.bold}>www.gingham.nyc</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

const Receipt = ({ receiptId, isPaymentCompleted, page }) => {
    const [receipt, setReceipt] = useState(null);
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPreparing, setIsPreparing] = useState(false);

    useEffect(() => {
        if (!receiptId) {
            setError("Invalid receipt ID.");
            setIsLoading(false);
            return;
        }

        fetch(`/api/receipts/${receiptId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) throw new Error(data.error);
                setReceipt(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch receipt:", err);
                setError(err.message);
                setIsLoading(false);
            });
    }, [receiptId]);

    useEffect(() => {
        if (receipt?.payment_intent_id) {
            setIsPreparing(true); // Show "Preparing download..."

            // ✅ Apply 1600ms delay for checkout, fetch immediately for profile
            const fetchTransaction = () => {
                fetch(`/api/stripe-transaction?payment_intent_id=${encodeURIComponent(receipt.payment_intent_id.trim())}`)
                    .then((res) => res.json())
                    .then((transactionData) => {
                        if (transactionData.error) throw new Error(transactionData.error);
                        setTransaction(transactionData);
                        setIsPreparing(false);
                    })
                    .catch((err) => {
                        console.error("Failed to fetch transaction:", err);
                        setError(err.message);
                        setIsPreparing(false);
                    });
            };

            if (page === "checkout") {
                // Delay fetch by 1600ms only for checkout
                const timer = setTimeout(fetchTransaction, 1700);
                return () => clearTimeout(timer);
            } else {
                // Fetch immediately for profile
                fetchTransaction();
            }
        }
    }, [receipt, page]);

    if (isLoading) return <p>Loading receipt...</p>;
    if (error) return <p style={{ color: "#ff4b5a" }}>Error: {error}</p>;
    if (!receipt) return <p>No receipt found.</p>;

    return (
        <>
            {page === 'checkout' && (
                <PDFDownloadLink 
                    document={<ReceiptDocument receipt={receipt} transaction={transaction} />} 
                    fileName={`gingham-receipt_${fileTimeConverter(receipt.created_at)}.pdf`}
                    className="btn btn-checkout"
                >
                    {({ loading }) => (isPreparing || loading ? "Preparing download..." : "Download Receipt")}
                </PDFDownloadLink>
            )}
            {page === 'profile' && (
                <PDFDownloadLink
                    document={<ReceiptDocument receipt={receipt} transaction={transaction} />}
                    fileName={`gingham-receipt_${fileTimeConverter(receipt.created_at)}.pdf`}
                    className="icon-file"
                >                        
                &emsp;
                </PDFDownloadLink>
            )}
        </>
    );
};

export default Receipt;