const LOCAL_STORAGE_KEY = 'myOrders'; // A constant for clarity
let orders = []; // Initialize as empty, as it will be loaded from storage
function loadOrdersFromLocalStorage() {
    const storedOrders = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedOrders) {
        try {
            orders = JSON.parse(storedOrders);
            // Data sanitization: ensure types are correct and location exists
            orders.forEach(order => {
                order.id = parseInt(order.id); // Ensure ID is a number
                order.quantity = parseInt(order.quantity); // Ensure quantity is a number
                if (!order.location) {
                    order.location = 'main-list'; // Assign default location if missing
                }
            });
        }
        catch (error) {
            console.error("Error parsing stored orders from localStorage:", error);
            orders = []; // Reset on error
        }
    }
    else {
        console.log("No orders found in localStorage. Using default sample data.");
        orders = [
            { id: 1, productName: 'Laptop', quantity: 1, status: 'Pending', location: 'main-list' },
            { id: 2, productName: 'Mouse', quantity: 2, status: 'Shipped', location: 'main-list' },
            { id: 3, productName: 'Keyboard', quantity: 1, status: 'Delivered', location: 'main-list' },
            { id: 4, productName: 'Monitor', quantity: 1, status: 'Pending', location: 'main-list' },
        ];
    }
}
function saveOrdersToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
    console.log("Orders saved to localStorage.");
}
// --- Initial load when the module is first imported ---
loadOrdersFromLocalStorage();
// Export functions that interact with the orders array
export function getAllOrders() {
    // Return a copy to prevent external modification of the original array
    return [...orders];
}
export function getSortedOrders(sortBy) {
    // 1. Isolate orders into two groups.
    const mainListOrders = [];
    const machineOrders = [];
    for (const order of orders) {
        if (order.location === 'main-list') {
            mainListOrders.push(order);
        }
        else {
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
export function addOrder(newOrderData) {
    const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const newOrder = {
        id: newId,
        location: 'main-list', // New orders always start in the main list
        ...newOrderData,
    };
    orders.push(newOrder);
    saveOrdersToLocalStorage();
    return newOrder;
}
export function deleteOrder(orderIdToDelete) {
    const initialLength = orders.length;
    orders = orders.filter(order => order.id !== orderIdToDelete);
    const wasDeleted = orders.length < initialLength;
    if (wasDeleted) {
        saveOrdersToLocalStorage();
    }
    return wasDeleted;
}
export function updateOrder(updatedOrder) {
    const index = orders.findIndex(order => order.id === updatedOrder.id);
    if (index !== -1) {
        // *** IMPORTANT FIX ***
        // Preserve the original location property from the existing order.
        // This prevents the form submission from accidentally erasing the location.
        const existingOrder = orders[index];
        orders[index] = {
            ...updatedOrder, // Takes all properties from the form (id, name, qty, status)
            location: existingOrder.location, // Explicitly keeps the old location
        };
        saveOrdersToLocalStorage();
        return true;
    }
    return false;
}
export function updateOrderLocationAndPosition(draggedOrderId, newLocation, newOrderIdsInList) {
    // 1. Find the order that was dragged in our main `orders` array.
    const draggedOrder = orders.find(o => o.id === draggedOrderId);
    if (!draggedOrder) {
        console.error(`Could not find dragged order with ID: ${draggedOrderId}`);
        return;
    }
    // 2. Update its location property. This is crucial for persistence.
    draggedOrder.location = newLocation;
    // 3. Re-sort the master `orders` array to match the visual order of the affected list.
    // This is the most complex part. We create a lookup map for efficiency.
    const orderMap = new Map(orders.map(order => [order.id, order]));
    // We start with the known new order of the list that was just changed.
    const reorderedList = newOrderIdsInList.map(id => orderMap.get(id));
    // Then, we gather all other orders that were NOT in that list.
    const otherOrders = orders.filter(order => !newOrderIdsInList.includes(order.id));
    // Finally, we combine them. The reordered list comes first to preserve its new sequence,
    // followed by all other untouched orders.
    // NOTE: This strategy assumes that reordering only happens within one list at a time,
    // which is how Sortable.js events work.
    orders = [...reorderedList, ...otherOrders];
    // 4. Save the fully updated and reordered array to localStorage.
    saveOrdersToLocalStorage();
}
export function reorderOrdersByIndex(oldIndex, newIndex) {
    if (oldIndex < 0 || oldIndex >= orders.length || newIndex < 0 || newIndex >= orders.length) {
        return false;
    }
    const [movedItem] = orders.splice(oldIndex, 1);
    orders.splice(newIndex, 0, movedItem);
    saveOrdersToLocalStorage();
    return true;
}
loadOrdersFromLocalStorage();
