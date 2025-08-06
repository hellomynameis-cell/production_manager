
export interface Order {
    id: number;
    productName: string;
    quantity: number;
    status: 'Pending' | 'Shipped' | 'Delivered';
    location: 'main-list' | 'machine-A' | 'machine-B' | 'machine-C'; // Define possible locations
}

export interface Machine {
    id: string; // A unique identifier, e.g., "machine-1", "press-a"
    name: string; // A user-friendly display name, e.g., "Machine 1", "Main Press"
}