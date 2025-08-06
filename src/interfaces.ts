
export interface Order {
    id: number;
    productName: string;
    quantity: number;
    status: 'Pending' | 'Shipped' | 'Delivered';
    location: string; // <--- DIE LÖSUNG
}

export interface Machine {
    id: string; // A unique identifier, e.g., "machine-1", "press-a"
    name: string; // A user-friendly display name, e.g., "Machine 1", "Main Press"
}