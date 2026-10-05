interface Env {
  UPSTREAM_URL: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/health") {
      return json({ ok: true });
    }

    if (pathname === "/api/schedule") {
      const upstreamUrl =
        env.UPSTREAM_URL ||
        "https://example.com/api/schedule-snapshot.php";

      try {
        const upstream = await fetch(upstreamUrl, {
          headers: {
            "User-Agent": "PK-Planner-Worker/1.0",
          },
        });

        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type":
              upstream.headers.get("Content-Type") ??
              "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=60, s-maxage=300",
            ...corsHeaders,
          },
        });
      } catch {
        return json({ error: "Upstream unavailable" }, 502);
      }
    }

    // Kolejne endpointy API dodaj tutaj.
    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
