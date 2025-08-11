
export interface Order {
    id: number;
    productName: string;
    quantity: number;
    status: 'rot' | 'gelb' | 'gruen';
    location: string; // <--- DIE LÖSUNG
    customerName: string;
    deliveryDate: string; // ISO 8601 format, e.g., "2023-10-01T12:00:00Z"
}

export interface Machine {
    id: string; // A unique identifier, e.g., "machine-1", "press-a"
    name: string; // A user-friendly display name, e.g., "Machine 1", "Main Presse"
}