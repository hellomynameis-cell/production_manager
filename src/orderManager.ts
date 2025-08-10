import { Order } from './interfaces'; // Import the Order interface
import { saveState, loadState } from './gistSync.js';



let orders: Order[] = []; // Initialize as empty, as it will be loaded from storage



export async function initializeManager(): Promise<void> {
    // Load the state from our Gist instead of localStorage
    orders = await loadState();

    // We keep your excellent data sanitization logic! This is very important.
    orders.forEach(order => {
        order.id = parseInt(order.id as any);
        order.quantity = parseInt(order.quantity as any);
        if (!order.location) {
            order.location = 'main-list';
        }
    });
    console.log("Orders loaded from Gist.");
}




// Export functions that interact with the orders array
export function getAllOrders(): Order[] {
    // Return a copy to prevent external modification of the original array
    return [...orders];
}

export function getSortedOrders(sortBy: string): Order[] {
    // 1. Isolate orders into two groups.
    const mainListOrders: Order[] = [];
    const machineOrders: Order[] = [];

    for (const order of orders) {
        if (order.location === 'main-list') {
            mainListOrders.push(order);
        } else {
            machineOrders.push(order);
        }
    }

    // 2. Sort ONLY the main list group.
    switch (sortBy) {
        case 'id-asc':
            mainListOrders.sort((a, b) => a.id - b.id);
            break;
        case 'id-desc':
            mainListOrders.sort((a, b) => b.id - a.id);
            break;
        case 'product-asc':
            mainListOrders.sort((a, b) => a.productName.localeCompare(b.productName));
            break;
        case 'product-desc':
            mainListOrders.sort((a, b) => b.productName.localeCompare(a.productName));
            break;
        default:
            // Default case, no sorting applied to main list.
            break;
    }

    // 3. Recombine the sorted main list with the untouched machine orders.
    // The spread operator (...) unpacks the elements of each array into the new one.
    return [...mainListOrders, ...machineOrders];
}

export async function addOrder(newOrderData: Omit<Order, 'id' | 'location'>): Promise<Order> {
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
        id: newId,
        location: 'main-list',
        ...newOrderData,
    };
    orders.push(newOrder);
    // CHANGE: Save to Gist instead of localStorage
    await saveState(orders);
    return newOrder;
}

export async function deleteOrder(orderIdToDelete: number): Promise<boolean> {
    const initialLength = orders.length;
    orders = orders.filter(order => order.id !== orderIdToDelete);
    const wasDeleted = orders.length < initialLength;
    if (wasDeleted) {
        // CHANGE: Save to Gist instead of localStorage
        await saveState(orders);
    }
    return wasDeleted;
}

export async function updateOrder(updatedOrder: Order): Promise<boolean> {
    const index = orders.findIndex(order => order.id === updatedOrder.id);
    if (index !== -1) {
        const existingOrder = orders[index];
        orders[index] = {
            ...updatedOrder,
            location: existingOrder.location,
        };
        // CHANGE: Save to Gist instead of localStorage
        await saveState(orders);
        return true;
    }
    return false;
}


export async function updateOrderLocationAndPosition(
    draggedOrderId: number,
    newLocation: string,
    newOrderIdsInList: number[]
): Promise<void> {
    // Your complex sorting logic here remains EXACTLY the same.
    const draggedOrder = orders.find(o => o.id === draggedOrderId);
    if (!draggedOrder) return;
    draggedOrder.location = newLocation;
    const orderMap = new Map(orders.map(order => [order.id, order]));
    const reorderedList = newOrderIdsInList.map(id => orderMap.get(id)!);
    const otherOrders = orders.filter(order => !newOrderIdsInList.includes(order.id));
    orders = [...reorderedList, ...otherOrders];
    
    // CHANGE: Save to Gist instead of localStorage
    await saveState(orders);
}





export async function reorderOrdersByIndex(oldIndex: number, newIndex: number): Promise<boolean> {
    if (oldIndex < 0 || oldIndex >= orders.length || newIndex < 0 || newIndex >= orders.length) {
        return false;
    }
    const [movedItem] = orders.splice(oldIndex, 1);
    orders.splice(newIndex, 0, movedItem);
    
    // CHANGE: Save to Gist instead of localStorage
    await saveState(orders);
    return true;
}

