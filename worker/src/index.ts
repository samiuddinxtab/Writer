export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({ message: "Worker running" }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
