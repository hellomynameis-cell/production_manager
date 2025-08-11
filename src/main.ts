// --- IMPORTS ---

declare const Sortable: any;


import { Order, Machine } from './interfaces.js';
import { initializeManager } from './orderManager.js';
import { createOrderTile } from './orderTile.js';


// Create formatters once for better performance


import {
    getAllOrders,
    getSortedOrders,
    addOrder,
    deleteOrder,
    updateOrder,
    updateOrderLocationAndPosition
} from './orderManager.js';

// --- CONFIGURATION ---
let machineList: Machine[] = []; // This will hold our machine data once loaded
let applySortOnNextRender = true;

// --- DOM ELEMENT REFERENCES ---
const addOrderForm = document.getElementById('add-order-form') as HTMLFormElement;
const orderIdToEditInput = document.getElementById('orderIdToEdit') as HTMLInputElement;
const productNameInput = document.getElementById('productName') as HTMLInputElement;
const quantityInput = document.getElementById('quantity') as HTMLInputElement;
const statusSelect = document.getElementById('status') as HTMLSelectElement;
const customerNameInput = document.getElementById('customerName') as HTMLSelectElement;
const dateInput = document.getElementById('deliveryDate') as HTMLSelectElement;

const submitOrderButton = document.getElementById('submitOrderButton') as HTMLButtonElement;
const resetFormButton = document.getElementById('resetFormButton') as HTMLButtonElement; // NEW: Reset button
const sortOrderSelect = document.getElementById('sortOrder') as HTMLSelectElement;

const ordersContainer = document.getElementById('orders-container') as HTMLElement; // Main order list
const machinesGridContainer = document.getElementById('machines-grid') as HTMLElement; // Parent for all machine divs


// --- HELPER FUNCTIONS ---

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        // If the container doesn't exist, do nothing.
        console.error('Toast container not found!');
        return;
    }

    // 1. Create a new div element for the toast
    const toastElement = document.createElement('div');

    // 2. Add the necessary CSS classes
    toastElement.className = `toast toast--${type}`;

    // 3. Set the message text
    toastElement.textContent = message;

    // 4. Add the new toast to the container
    toastContainer.appendChild(toastElement);

    // 5. Set a timer to remove the toast after it has faded out
    // The total duration is 3000ms (3s) based on our CSS animation
    setTimeout(() => {
        toastElement.remove();
    }, 3000);
}





async function loadMachineData(): Promise<Machine[]> {
    try {
        const response = await fetch('machines.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Machine[] = await response.json();
        return data;
    } catch (error) {
        console.error("Could not load or parse machines.json:", error);
        machinesGridContainer.innerHTML = '<p class="error">Error: Could not load machine data.</p>';
        return []; // Return empty array on failure
    }
}

/**
 * Dynamically generates all machine containers and appends them to the DOM.
 * Initializes Sortable.js for each generated machine order list.
 */
function setupMachinesUI(): void {
    if (!machinesGridContainer) return;

    // Generate HTML from the loaded machine data
    machinesGridContainer.innerHTML = machineList.map(machine => `
        <div id="${machine.id}" class="machine-container">
            <h3>${machine.name}</h3>
            <div class="machine-orders">
                <!-- Orders for this machine will be rendered here -->
            </div>
        </div>
    `).join('');

    // Initialize Sortable.js on each dynamically created machine list
    machineList.forEach(machine => {
        const machineOrdersDiv = document.querySelector(`#${machine.id} .machine-orders`) as HTMLElement;
        if (machineOrdersDiv) {
            new Sortable(machineOrdersDiv, {
                group: 'shared-orders',
                animation: 150,
                onEnd: handleDragEnd,
            });
        }
    });
}
/**
 * Helper function to determine the location string (e.g., 'main-list', 'machine-1')
 * from a DOM container element.
 * @param container The Sortable.js `evt.to` or `evt.from` container element.
 * @returns The location string associated with that container.
 */
function getLocationFromContainer(container: HTMLElement): string {
    if (container === ordersContainer) {
        return 'main-list';
    } else if (container.classList.contains('machine-orders') && container.parentElement) {
        return container.parentElement.id;
    }
    return '';
}

// --- CORE APPLICATION LOGIC ---

/**
 * Renders all orders to their correct lists based on their `location` property.
 */
function renderOrders(): void {
    // 1. Clear all lists
    ordersContainer.innerHTML = '';
    document.querySelectorAll('.machine-orders').forEach(container => {
        container.innerHTML = '';
    });

    // 2. Get orders to display
    const ordersToDisplay = applySortOnNextRender
        ? getSortedOrders(sortOrderSelect.value)
        : getAllOrders();

    // 3. Create and append order elements
    ordersToDisplay.forEach(order => {
        const orderDiv = createOrderTile(order);

        // 4. Append to the correct container
        let targetContainer: HTMLElement | null = null;
        if (order.location === 'main-list') {
            targetContainer = ordersContainer;
        } else {
            // Find any machine container by its ID based on the order's location
            targetContainer = document.querySelector(`#${order.location} .machine-orders`);
        }

        if (targetContainer) {
            targetContainer.appendChild(orderDiv);
        } else if (order.location !== 'main-list') {
            console.warn(`Container for location "${order.location}" not found. Moving order ID ${order.id} to main list.`);
            order.location = 'main-list';
            updateOrderLocationAndPosition(order.id, 'main-list', []); // Move it officially
            ordersContainer.appendChild(orderDiv);
        }
    });

    applySortOnNextRender = false;
}

/**
 * Handles the submission of the order form for both adding and updating.
 */
function handleFormSubmit(event: Event): void {
    event.preventDefault();

    const productName = productNameInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    const status = statusSelect.value as 'rot' | 'gelb' | 'gruen';
    const customerName = customerNameInput.value.trim();
    const deliveryDate = dateInput.value.trim();

    // The validation check is still perfect.
    if (!productName || !customerName || isNaN(quantity) || quantity <= 0 || !deliveryDate) {
        showToast('Bitte alle Felder korrekt ausfüllen.', 'error'); // "Please fill out all fields correctly."
        return;
    }

    const orderIdToEdit = orderIdToEditInput.value;
    let message = '';

    if (orderIdToEdit) {
    
        updateOrder({
            id: parseInt(orderIdToEdit),
            productName,
            quantity,
            status,
            customerName,
            deliveryDate,
            location: ''
        });
        
        message = 'Auftrag erfolgreich aktualisiert!'; // "Order updated successfully!"

    } else {
        // --- ADD MODE ---
        // This is the key change. We now create a complete object that satisfies
        // the Order interface by providing a default 'location'.
        addOrder({
            productName,
            quantity,
            status,
            customerName,
            deliveryDate,

        });
        // No 'as Order' cast is needed because the object is now correct.
        
        message = 'Neuer Auftrag hinzugefügt!'; // "New order added!"
    }

    resetForm();
    renderOrders(); // Re-render the lists to show the changes.

    // Using setTimeout ensures the toast appears after the render completes.
    setTimeout(() => {
        showToast(message, 'success');
    }, 0); 
}

/**
 * Populates the form with an order's data for editing.
 */
export function handleEditClick(orderId: number): void { // <-- ADD EXPORT
    const orderToEdit = getAllOrders().find(order => order.id === orderId);
    if (orderToEdit) {
        // ... (rest of the function is the same)
        productNameInput.value = orderToEdit.productName;
        quantityInput.value = orderToEdit.quantity.toString();
        statusSelect.value = orderToEdit.status;
        customerNameInput.value = orderToEdit.customerName;
        dateInput.value = orderToEdit.deliveryDate;
        orderIdToEditInput.value = orderToEdit.id.toString();
        submitOrderButton.textContent = 'Update Order';
        addOrderForm.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Handles the deletion of an order.
 */
export function handleDeleteClick(orderId: number): void { // <-- ADD EXPORT
    if (confirm(`Sind Sie sicher, dass Sie Auftrag #${orderId} löschen möchten?`)) { // Adjusted to German
        deleteOrder(orderId);
        renderOrders(); // Re-render to reflect the deletion.
        showToast('Auftrag gelöscht!', 'success');
    }
}

/**
 * Resets the form to its default state for adding new orders.
 */
function resetForm(): void {
    addOrderForm.reset();
    orderIdToEditInput.value = '';
    submitOrderButton.textContent = 'Add Order';
}

// --- DRAG-AND-DROP HANDLER ---

/**
 * This single function handles the end of any drag-and-drop operation from any list.
 */
function handleDragEnd(evt: any): void {
    const draggedItem = evt.item; // The HTML element that was dragged
    const targetList = evt.to;   // The HTML element of the list where it was dropped
    const sourceList = evt.from; // The list where the item came from


      const draggedOrderId = parseInt(draggedItem.dataset.orderId || '0');
    if (!draggedOrderId) {
        console.error("Dragged item is missing an order ID.");
        // If the item can't be identified, it's safer to re-render to avoid inconsistency.
        renderOrders(); 
        return;
    }

    const newLocation = getLocationFromContainer(targetList);
    if (!newLocation) {
        console.error("Could not determine new location for dropped item.");
        // Re-render to fix any visual glitch.
        renderOrders();
        return;
    }

    // Get the array of all order IDs in the target list, in their new visual order.
    const newOrderIdsInList = Array.from(targetList.children)
        .map(item => parseInt((item as HTMLElement).dataset.orderId || '0'))
        .filter(id => id > 0);

    // Call the order manager to update the data model and persist the changes.
    updateOrderLocationAndPosition(draggedOrderId, newLocation, newOrderIdsInList);

    // Re-render the UI to ensure consistency with the updated data model.
    // applySortOnNextRender is already false, preserving manual order.
    if (sourceList === ordersContainer && sortOrderSelect.value !== 'manual') {
        applySortOnNextRender = true;
        // This is a situation where a partial re-render might be needed,
        // but for now, let's stick to the main fix. The simplest solution
        // is to just accept the manual order after a drag.
    }
    
    // IMPORTANT: Make sure the main list's sort order is now set to 'manual'
    // because you have manually changed the order.
    sortOrderSelect.value = 'manual';
    applySortOnNextRender = false;
}

/**
 * Main function to start the application.
 * It ensures data is loaded before the UI is built.
 */
async function initializeApp(): Promise<void> {
    // 1. Load the machine configuration from JSON
    machineList = await loadMachineData();

    // 2. Build the machine UI based on the loaded data
    setupMachinesUI();

    await initializeManager(); 

    // 3. Attach event listeners
    addOrderForm.addEventListener('submit', handleFormSubmit);
    resetFormButton.addEventListener('click', resetForm);
    sortOrderSelect.addEventListener('change', () => {
        applySortOnNextRender = true;
        renderOrders();
    });

    // 4. Initialize Sortable.js for the main orders container
    new Sortable(ordersContainer, {
        group: 'shared-orders',
        animation: 150,
        onEnd: handleDragEnd,
    });

    window.addEventListener('click', () => {
        // Find all open dropdowns
        const openDropdowns = document.querySelectorAll('.menu-dropdown.show');
        // Close each one
        openDropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });
    // 5. Initial render of orders into the now-ready containers
    renderOrders();
}

// Start the entire application
initializeApp();