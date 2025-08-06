var Orderlist = [
    { id: 1, productName: 'Laptop', quantity: 1, status: 'Pending' },
    { id: 2, productName: 'Mouse', quantity: 2, status: 'Shipped' },
    { id: 3, productName: 'Keyboard', quantity: 1, status: 'Delivered' },
    { id: 4, productName: 'Monitor', quantity: 1, status: 'Pending' },
];
var ordersContainer = document.getElementById('orders-container');
var addOrderForm = document.getElementById('add-order-form'); // Cast to HTMLFormElement
var productNameInput = document.getElementById('productName');
var quantityInput = document.getElementById('quantity');
var statusSelect = document.getElementById('status');
function handleDeleteOrder(orderIdToDelete) {
    // Filter out the order with the given ID   
    Orderlist = Orderlist.filter(function (order) { return order.id !== orderIdToDelete; });
    renderOrders(); // Re-render the list to reflect the change
}
function renderOrders() {
    if (ordersContainer) {
        ordersContainer.innerHTML = ''; // Clear existing orders before re-rendering
        // 4. Iterate and Create Elements:
        // Place this code *inside* the `if (ordersContainer)` block.
        // This loop goes through each order in your 'orders' array.
        Orderlist.forEach(function (order) {
            var orderDiv = document.createElement('div');
            orderDiv.classList.add('order-item');
            orderDiv.innerHTML = "\n            <h4>Order #".concat(order.id, " - ").concat(order.productName, "</h4>\n            <p>Quantity: ").concat(order.quantity, "</p>\n            <p>Status: <strong>").concat(order.status, "</strong></p>\n            <button class=\"delete-button\">Delete Order</button> <!-- ADD THIS LINE -->\n        ");
            var deleteButton = orderDiv.querySelector('.delete-button');
            if (deleteButton) {
                // Attach an event listener to the delete button
                deleteButton.addEventListener('click', function () {
                    // Call handleDeleteOrder with the ID of the order
                    handleDeleteOrder(order.id);
                });
            }
            // Finally, add this newly created 'orderDiv' to the 'ordersContainer' found earlier.
            ordersContainer.appendChild(orderDiv);
        });
    }
    else {
        console.error("Error: Element with ID 'orders-container' not found in the DOM.");
    }
}
// Function to handle form submission
function handleAddOrder(event) {
    event.preventDefault(); // Prevent the default form submission (page reload)
    var productName = productNameInput.value;
    var quantity = parseInt(quantityInput.value); // Convert string to number
    var status = statusSelect.value; // Cast to the specific union type
    // Basic validation (optional, but good practice)
    if (!productName || quantity < 1) {
        alert('Please enter a valid product name and quantity.');
        return;
    }
    // Generate a new unique ID (simple approach for now)
    var newId = Orderlist.length > 0 ? Math.max.apply(Math, Orderlist.map(function (o) { return o.id; })) + 1 : 1;
    var newOrder = {
        id: newId,
        productName: productName,
        quantity: quantity,
        status: status
    };
    Orderlist.push(newOrder); // Add the new order to our array
    renderOrders(); // Re-render the list to show the new order
    // Clear the form fields after submission
    productNameInput.value = '';
    quantityInput.value = '1'; // Reset quantity to 1
    statusSelect.value = 'Pending'; // Reset status to Pending
}
// Add event listener to the form
if (addOrderForm) {
    addOrderForm.addEventListener('submit', handleAddOrder);
}
else {
    console.error("Error: Element with ID 'add-order-form' not found in the DOM.");
}
// Initial render of orders when the page loads
renderOrders();
