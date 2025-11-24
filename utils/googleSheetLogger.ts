
import { Transaction, TransactionType } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGU8Ol-_ZhUOe_NxlCXjnbRNy4aeGC48lG5Xf6lCjEomO_JuHbUybz8BADvDHxaTecNw/exec';

/**
 * Logs a transaction to a Google Sheet via an Apps Script endpoint.
 * This is an "async fire-and-forget" operation and will not block the UI.
 * Errors, including HTTP errors, are logged to the console for debugging.
 */
export const logTransactionToSheet = async (transaction: Transaction): Promise<void> => {
    try {
        let locationInfo = '';
        if (transaction.type === TransactionType.IN) {
            locationInfo = `To: ${transaction.toLocation}`;
        } else if (transaction.type === TransactionType.OUT) {
            locationInfo = `From: ${transaction.fromLocation}`;
        } else if (transaction.type === TransactionType.SHIFT) {
            locationInfo = `From: ${transaction.fromLocation} -> To: ${transaction.toLocation}`;
        } else if (transaction.type === TransactionType.STATUS_CHANGE) {
            locationInfo = `Status Update (@${transaction.item.location})`;
        }

        const payload = {
            type: transaction.type,
            itemCode: transaction.item.itemCode,
            pcs: transaction.item.pcs,
            kgs: transaction.item.kgs,
            locationInfo: locationInfo,
            user: transaction.username,
            timestamp: new Date(transaction.timestamp).toISOString(),
            notes: transaction.notes || '', // Pass notes for status changes
        };

        const formData = new FormData();
        for (const key in payload) {
            formData.append(key, String((payload as any)[key]));
        }

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
        });
        
        // Check for HTTP errors (e.g., 404, 500, redirects).
        if (!response.ok) {
            console.error(
                'Failed to log transaction to Google Sheet. Status:', 
                response.status, 
                response.statusText
            );
             // Log the response body for more details, as it might contain an error message from the script.
            const responseBody = await response.text();
            console.error('Response body:', responseBody);
        }

    } catch (error) {
        console.error('Error sending transaction log to Google Sheet:', error);
    }
};
