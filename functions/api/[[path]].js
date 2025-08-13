/**
 * A generic API handler that saves (POST) and loads (GET) the entire order state.
 */
export async function onRequest(context) {
  // context contains information about the request, including the KV bindings.
  const { request, env } = context;

  // The key we will use to store our data in KV.
  const KV_KEY = "orders_state";

  // Handle a GET request (Load State)
  if (request.method === "GET") {
    try {
      const savedState = await env.ORDERS_KV.get(KV_KEY);
      
      // If no state is found, return a default empty array.
      const data = savedState ? JSON.parse(savedState) : [];
      
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(`Error loading state: ${error.message}`, { status: 500 });
    }
  }

  // Handle a POST request (Save State)
  if (request.method === "POST") {
    try {
      const newState = await request.text();
      // Write the new state (as a string) to our KV namespace.
      await env.ORDERS_KV.put(KV_KEY, newState);
      
      return new Response('State saved successfully.', { status: 200 });
    } catch (error) {
      return new Response(`Error saving state: ${error.message}`, { status: 500 });
    }
  }

  // Handle other methods
  return new Response('Method not allowed.', { status: 405 });
}