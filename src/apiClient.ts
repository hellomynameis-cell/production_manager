// apiClient.ts - Talks to YOUR Cloudflare Worker API

import { Order } from './interfaces.js';

// The new API endpoint is on our own site.
const API_ENDPOINT = '/api/orders';

export async function saveState(orders: Order[]): Promise<void> {
    try {
        await fetch(API_ENDPOINT, {
            method: 'POST',
            // No authorization header needed on the client side anymore!
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orders, null, 2)
        });
        console.log('State saved successfully to Cloudflare.');
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

export async function loadState(): Promise<Order[]> {
    try {
        const response = await fetch(API_ENDPOINT); // Simple GET request
        if (!response.ok) {
            throw new Error(`Failed to load state: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Could not load state:', error);
        return []; // Return empty array on failure
    }
}