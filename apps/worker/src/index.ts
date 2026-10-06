import mobileAppConfig from "../../mobile/app.json" with { type: "json" };
import { parseRegistration, NotificationStore } from './notificationStore.ts';

export { NotificationStore };

interface Env {
  UPSTREAM_URL: string;
  FCM_SERVICE_ACCOUNT_JSON?: string;
  NOTIFICATIONS: DurableObjectNamespace;
}

const mobileAppVersion = mobileAppConfig.expo.version;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
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

    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const isApiHost = hostname.startsWith("api.");
    const pathname = url.pathname;
    const notificationPath = pathname.match(/^\/(?:api\/)?notifications\/([0-9a-f-]{36})$/i);
    if (notificationPath && (pathname.startsWith('/api/') || isApiHost)) {
      if (!['PUT', 'DELETE'].includes(request.method)) {
        return json({ error: 'Method not allowed' }, 405);
      }
      if (!env.FCM_SERVICE_ACCOUNT_JSON || !env.NOTIFICATIONS) {
        return json({ error: 'FCM is not configured' }, 503);
      }
      const id = notificationPath[1];
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return json({ error: 'Invalid installation ID' }, 400);
      }
      let registration;
      if (request.method === 'PUT') {
        const raw = await request.text();
        if (raw.length > 120_000) return json({ error: 'Payload too large' }, 413);
        try {
          registration = parseRegistration(JSON.parse(raw));
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        if (!registration) return json({ error: 'Invalid registration' }, 400);
      }
      const stub = env.NOTIFICATIONS.getByName('all-devices');
      const response = await stub.fetch(new Request(`https://notification-store/${id}`, {
        method: request.method,
        body: registration ? JSON.stringify(registration) : undefined,
      }));
      return json(await response.json(), response.status);
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

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
          notifications: isApiHost ? '/notifications/:installationId' : '/api/notifications/:installationId',
        },
      });
    }

    if (isHealthEndpoint) {
      return json({ ok: true });
    }

    if (isVersionEndpoint) {
      try {
        const release = await fetch("https://api.github.com/repos/SideArker/pk-planner/releases/latest", {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "PK-Planner-Worker",
          },
          cf: { cacheTtl: 300, cacheEverything: true },
        });

        if (release.ok) {
          const data = await release.json() as {
            tag_name?: string;
            assets?: Array<{ name?: string; browser_download_url?: string }>;
          };
          const version = data.tag_name?.replace(/^v/, "");
          const apk = data.assets?.find((asset) => asset.name === "app-release.apk");
          if (version && apk?.browser_download_url) {
            return json({ version, apkUrl: apk.browser_download_url });
          }
        }
      } catch {
        // Fall back to the version built into this Worker.
      }

      return json({ version: mobileAppVersion });
    }

    if (isScheduleEndpoint) {
      const upstreamUrl = env.UPSTREAM_URL;

      if (!upstreamUrl) {
        return json({ error: "UPSTREAM_URL is not configured" }, 500);
      }

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

    return json({ error: "Not found" }, 404);
  },
  async scheduled(controller, env): Promise<void> {
    if (!env.FCM_SERVICE_ACCOUNT_JSON) return;
    const stub = env.NOTIFICATIONS.getByName('all-devices');
    const result = await stub.fetch(new Request(`https://notification-store/tick?at=${controller.scheduledTime}`));
    if (!result.ok) console.error(`Notification tick failed: ${result.status}`);
  },
} satisfies ExportedHandler<Env>;
