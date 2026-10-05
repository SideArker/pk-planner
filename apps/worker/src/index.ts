import mobileAppConfig from "../../mobile/app.json" with { type: "json" };

interface Env {
  UPSTREAM_URL: string;
}

const mobileAppVersion = mobileAppConfig.expo.version;

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
      "Cache-Control": "no-store",
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

    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const isApiHost = hostname.startsWith("api.");
    const pathname = url.pathname;

    const isHealthEndpoint =
      pathname === "/health" ||
      pathname === "/api/health" ||
      (isApiHost && pathname === "/health");

    const isVersionEndpoint =
      pathname === "/api/version" ||
      (isApiHost && (pathname === "/version" || pathname === "/version/"));

    const isScheduleEndpoint =
      pathname === "/api/schedule" ||
      (isApiHost && (pathname === "/schedule" || pathname === "/schedule/"));

    const isApiRoot =
      pathname === "/api" ||
      pathname === "/api/" ||
      (isApiHost && (pathname === "/" || pathname === ""));

    if (isApiRoot) {
      return json({
        ok: true,
        name: "pk-planner-api",
        endpoints: {
          schedule: isApiHost ? "/schedule" : "/api/schedule",
          version: isApiHost ? "/version" : "/api/version",
          health: isApiHost ? "/health" : "/api/health",
        },
      });
    }

    if (isHealthEndpoint) {
      return json({ ok: true });
    }

    if (isVersionEndpoint) {
      return json({ version: mobileAppVersion });
    }

    if (isScheduleEndpoint) {
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
