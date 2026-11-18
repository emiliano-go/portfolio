// Liveness probe. Never cached, never authenticated; referenced as the `status`
// link relation in /.well-known/api-catalog.
export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      site: 'https://emiliano-go.com/',
      time: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
