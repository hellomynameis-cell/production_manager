// NEW FILE: orderTile.ts

import { Order } from './interfaces.js';
import { handleEditClick, handleDeleteClick } from './main.js';

// Create formatters once for better performance
const germanNumberFormatter = new Intl.NumberFormat('de-DE');
const germanDateFormatter = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

export function createOrderTile(order: Order): HTMLDivElement {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    orderDiv.dataset.orderId = order.id.toString();
    orderDiv.draggable = true;

    orderDiv.classList.add(`status-highlight-${order.status}`);


    orderDiv.innerHTML = `
        <div class="order-menu">
            <button class="menu-toggle-button" aria-label="Aktionen">⋮</button>
            <div class="menu-dropdown">
                <button class="menu-action-button edit-button">Bearbeiten</button>
                <button class="menu-action-button delete-button">Löschen</button>
            </div>
        </div>

        <h4>${order.productName}</h4>
        <h4>${order.customerName}</h4>
        <p>Menge: <strong>${germanNumberFormatter.format(order.quantity)}</strong></p>
        <p>Termin: <strong>${order.deliveryDate}</strong>
        <span class="traffic-light"></span>
        </p>
    `;

    const menuToggleButton = orderDiv.querySelector('.menu-toggle-button');
    const menuDropdown = orderDiv.querySelector('.menu-dropdown') as HTMLElement;

    menuToggleButton?.addEventListener('click', (event) => {
        event.stopPropagation();
        // Close all other menus before showing this one
        document.querySelectorAll('.menu-dropdown.show').forEach(m => m.classList.remove('show'));
        menuDropdown.classList.toggle('show');
    });

    // Use the imported functions for the event listeners
    orderDiv.querySelector('.edit-button')?.addEventListener('click', () => {
        handleEditClick(order.id);
        menuDropdown.classList.remove('show'); // Close menu after click
    });

    orderDiv.querySelector('.delete-button')?.addEventListener('click', () => {
        handleDeleteClick(order.id);
        menuDropdown.classList.remove('show'); // Close menu after click
    });

    return orderDiv;
}