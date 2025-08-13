// In /functions/api/[[path]].js

export async function onRequest(context) {
  // context contains information about the request, including the KV binding.
  const { request, env } = context;

  // The key we will use to store our data in KV.
  const KV_KEY = "orders_state";

  // Handle a GET request (Load State)
  if (request.method === "GET") {
    try {
      // Ensure we are using the correct, uppercase variable name.
      const savedState = await env.ORDERS_KV.get(KV_KEY);
      
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
      // Ensure we are using the correct, uppercase variable name here as well.
      await env.ORDERS_KV.put(KV_KEY, newState);
      
      return new Response('State saved successfully.', { status: 200 });
    } catch (error) {
      return new Response(`Error saving state: ${error.message}`, { status: 500 });
    }
  }

  // Handle other methods
  return new Response('Method not allowed.', { status: 405 });
}