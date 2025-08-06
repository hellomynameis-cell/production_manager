// --- IMPORTS ---

import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js';

import { Order, Machine } from './interfaces.js';

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
const submitOrderButton = document.getElementById('submitOrderButton') as HTMLButtonElement;
const resetFormButton = document.getElementById('resetFormButton') as HTMLButtonElement; // NEW: Reset button
const sortOrderSelect = document.getElementById('sortOrder') as HTMLSelectElement;

const ordersContainer = document.getElementById('orders-container') as HTMLElement; // Main order list
const machinesGridContainer = document.getElementById('machines-grid') as HTMLElement; // Parent for all machine divs


// --- HELPER FUNCTIONS ---

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
        const orderDiv = document.createElement('div');
        // ... (The creation of orderDiv.innerHTML is exactly the same as before) ...
        orderDiv.className = 'order-item';
        orderDiv.dataset.orderId = order.id.toString();
        orderDiv.draggable = true;
        orderDiv.innerHTML = `
            <h4>Order #${order.id} - ${order.productName}</h4>
            <p>Quantity: ${order.quantity}</p>
            <p>Status: <strong class="status-${order.status}">${order.status}</strong></p>
            <div class="order-actions">
                <button class="edit-button">Edit</button>
                <button class="delete-button">Delete Order</button>
            </div>
        `;

        orderDiv.querySelector('.edit-button')?.addEventListener('click', () => handleEditClick(order.id));
        orderDiv.querySelector('.delete-button')?.addEventListener('click', () => handleDeleteClick(order.id));

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
            // If the machine doesn't exist anymore, move order to main list
            console.warn(`Container for location "${order.location}" not found. Moving order ID ${order.id} to main list.`);
            order.location = 'main-list';
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
    const status = statusSelect.value as 'Pending' | 'Shipped' | 'Delivered';

    if (!productName || isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid product name and a quantity greater than 0.');
        return;
    }

    const orderIdToEdit = orderIdToEditInput.value;

    if (orderIdToEdit) {
        // --- UPDATE MODE ---
        updateOrder({
            id: parseInt(orderIdToEdit),
            productName,
            quantity,
            status,
            // Location is preserved by orderManager's updateOrder, so no need to pass it here.
        } as Order); // Cast to Order because the location property will be added by orderManager.
    } else {
        // --- ADD MODE ---
        addOrder({ productName, quantity, status });
    }

    resetForm();
    renderOrders(); // Re-render the lists to show the changes.
}

/**
 * Populates the form with an order's data for editing.
 */
function handleEditClick(orderId: number): void {
    const orderToEdit = getAllOrders().find(order => order.id === orderId);
    if (orderToEdit) {
        productNameInput.value = orderToEdit.productName;
        quantityInput.value = orderToEdit.quantity.toString();
        statusSelect.value = orderToEdit.status;
        orderIdToEditInput.value = orderToEdit.id.toString();
        submitOrderButton.textContent = 'Update Order';
        addOrderForm.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Handles the deletion of an order.
 */
function handleDeleteClick(orderId: number): void {
    if (confirm(`Are you sure you want to delete Order #${orderId}?`)) {
        deleteOrder(orderId);
        renderOrders(); // Re-render to reflect the deletion.
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
function handleDragEnd(evt: Sortable.SortableEvent): void {
    const draggedItem = evt.item; // The HTML element that was dragged
    const targetList = evt.to;   // The HTML element of the list where it was dropped

    const draggedOrderId = parseInt(draggedItem.dataset.orderId || '0');
    if (!draggedOrderId) {
        console.warn("Dragged item missing order ID.");
        return;
    }

    const newLocation = getLocationFromContainer(targetList);
    if (!newLocation) {
        console.warn("Could not determine new location for dropped item.");
        return;
    }

    // Get the array of all order IDs in the target list, in their new visual order.
    // Important: .children gives live HTMLCollection, Array.from converts it.
    const newOrderIdsInList = Array.from(targetList.children)
        .map(item => parseInt((item as HTMLElement).dataset.orderId || '0'))
        .filter(id => id > 0); // Filter out any potential non-order elements or 0s

    // Call the order manager to update the data model and persist the changes.
    updateOrderLocationAndPosition(draggedOrderId, newLocation, newOrderIdsInList);

    // Re-render the UI to ensure consistency with the updated data model.
    // applySortOnNextRender is already false, preserving manual order.
    renderOrders();
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

    // 5. Initial render of orders into the now-ready containers
    renderOrders();
}

// Start the entire application
initializeApp();