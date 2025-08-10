// --- gistSync.ts (NEW, SIMPLER VERSION) ---

import { Order } from './interfaces.js';
// Import from our new, safe config file
import { GIST_ID, SECRET_PAT, FILENAME } from './config.js';

// The rest of this file is now IDENTICAL to your original working version,
// but without the secret variables defined inside it.

export async function saveState(orders: Order[]): Promise<void> {
    try {
        await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${SECRET_PAT}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                files: {
                    [FILENAME]: {
                        content: JSON.stringify(orders, null, 2)
                    }
                }
            })
        });
        console.log('State saved successfully to Gist!');
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

export async function loadState(): Promise<Order[]> {
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        if (!response.ok) throw new Error('Failed to load Gist');
        
        const data = await response.json();
        const content = data.files[FILENAME].content;
        return JSON.parse(content);
        
    } catch (error) {
        console.error('Could not load state:', error);
        return [];
    }
}