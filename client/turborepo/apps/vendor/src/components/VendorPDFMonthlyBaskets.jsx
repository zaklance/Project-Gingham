import React from "react";
import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatBasketDate } from "@repo/ui/helpers.js";
import { months } from "@repo/ui/common.js";

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica', color: "#3b4752", backgroundColor: '#fbf7eb' },
    header: { fontSize: 18, textAlign: "center", marginBottom: 0 },
    image: { margin: "0 auto", height: "80px", width: "80px" },
    section: { marginBottom: 20 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    rowItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    rowFooter: { flexDirection: "row", justifyContent: "space-between" },
    bold: { fontFamily: "Helvetica-Bold", fontWeight: "bold" },
    divider: { borderBottom: "2px solid #3b4752", marginVertical: 4 },
    center: { margin: "0 auto" },
    footer: { position: "absolute", width: "100%", paddingLeft: 30, paddingRight: 30, left: 0, bottom: 24 },
});

function getCurrentYear() {
    return new Date().getFullYear();
}

export const ReceiptDocument = ({ filteredBaskets, year, month }) => {

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

                <Text style={styles.bold}>Items Sold:</Text>
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
                        <Text style={styles.bold}>&copy; {getCurrentYear()} GINGHAM NYC</Text>
                        <Text style={styles.bold}>www.gingham.nyc</Text>
                    </View>
                </View>
                <View style={styles.footer} fixed>
                    <View style={styles.center}>
                        <Text style={styles.bold} render={({ pageNumber }) => (`${pageNumber}`)}></Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};



export default ReceiptDocument;