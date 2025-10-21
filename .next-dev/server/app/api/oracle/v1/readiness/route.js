(() => {
  var a = {};
  ((a.id = 1469),
    (a.ids = [1469]),
    (a.modules = {
      261: a => {
        'use strict';
        a.exports = require('next/dist/shared/lib/router/utils/app-paths');
      },
      3295: a => {
        'use strict';
        a.exports = require('next/dist/server/app-render/after-task-async-storage.external.js');
      },
      10846: a => {
        'use strict';
        a.exports = require('next/dist/compiled/next-server/app-page.runtime.prod.js');
      },
      19121: a => {
        'use strict';
        a.exports = require('next/dist/server/app-render/action-async-storage.external.js');
      },
      25578: (a, b, c) => {
        'use strict';
        c.d(b, { YO: () => k });
        var d = c(41315);
        class e {
          get(a) {
            let b = this.store.get(a);
            return b
              ? Date.now() > b.expires
                ? (this.store.delete(a), null)
                : b.data
              : null;
          }
          set(a, b, c = 36e5) {
            this.store.set(a, { data: b, expires: Date.now() + c });
          }
          delete(a) {
            this.store.delete(a);
          }
          cleanup() {
            let a = Date.now();
            for (let [b, c] of this.store.entries())
              a > c.expires && this.store.delete(b);
          }
          constructor() {
            this.store = new Map();
          }
        }
        class f {
          constructor() {
            this.client = null;
          }
          async get(a) {
            if (!this.client) return null;
            try {
              let b = await this.client.get(a);
              return b ? JSON.parse(b) : null;
            } catch (a) {
              return (console.error('Redis get error:', a), null);
            }
          }
          async set(a, b, c = 3600) {
            if (this.client)
              try {
                await this.client.setex(a, c, JSON.stringify(b));
              } catch (a) {
                console.error('Redis set error:', a);
              }
          }
        }
        class g {
          constructor() {
            ((this.memoryStore = new e()),
              (this.redisStore = new f()),
              (this.cleanupInterval = setInterval(() => {
                this.memoryStore.cleanup();
              }, 3e5)));
          }
          async checkLimit(a, b, c) {
            let d = `rl:${b}:${a}`,
              e = Date.now();
            try {
              let a = this.memoryStore.get(d) || (await this.redisStore.get(d));
              a ||
                (a = { tokens: c, lastRefill: e, capacity: c, refillRate: c });
              let b = (e - a.lastRefill) / 6e4,
                f = Math.floor(b * a.refillRate);
              if (
                (f > 0 &&
                  ((a.tokens = Math.min(a.capacity, a.tokens + f)),
                  (a.lastRefill = e)),
                a.tokens <= 0)
              )
                return (
                  this.memoryStore.set(d, a),
                  await this.redisStore.set(d, a, 3600),
                  {
                    allowed: !1,
                    remainingTokens: 0,
                    resetTime: a.lastRefill + 6e4,
                    error: 'rate_limit_exceeded',
                  }
                );
              return (
                (a.tokens -= 1),
                this.memoryStore.set(d, a),
                await this.redisStore.set(d, a, 3600),
                {
                  allowed: !0,
                  remainingTokens: a.tokens,
                  resetTime: a.lastRefill + 6e4,
                }
              );
            } catch (a) {
              return (
                console.error('Rate limit check error:', a),
                {
                  allowed: !0,
                  remainingTokens: c,
                  resetTime: e + 6e4,
                  error: 'rate_limit_error',
                }
              );
            }
          }
          getClientIP(a) {
            let b = a.headers.get('x-forwarded-for');
            if (b) return b.split(',')[0].trim();
            let c = a.headers.get('x-real-ip');
            if (c) return c;
            let d = a.headers.get('cf-connecting-ip');
            return d || '127.0.0.1';
          }
          getRoutePattern(a) {
            return a
              .replace(/\/\d+/g, '/[id]')
              .replace(/\/[a-f0-9-]{36}/g, '/[uuid]')
              .replace(/\/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g, '/[guid]');
          }
          cleanup() {
            this.cleanupInterval && clearInterval(this.cleanupInterval);
          }
        }
        let h = null,
          i = {
            '/api/actions/*': parseInt(
              process.env.RATE_ACTIONS_PER_MIN || '10'
            ),
            '/api/control/*': parseInt(
              process.env.RATE_ACTIONS_PER_MIN || '10'
            ),
            '/api/research/backtest/run': parseInt(
              process.env.RATE_RESEARCH_RUN_PER_MIN || '6'
            ),
            '/api/generate/report/*': parseInt(
              process.env.RATE_REPORTS_PER_MIN || '5'
            ),
            '/api/read/*': parseInt(process.env.RATE_DEFAULT_PER_MIN || '120'),
            '/api/research/*': parseInt(
              process.env.RATE_DEFAULT_PER_MIN || '120'
            ),
            '*': parseInt(process.env.RATE_DEFAULT_PER_MIN || '120'),
          },
          j = ['/api/metrics', '/api/stream/alerts', '/api/healthz'];
        async function k(a, b) {
          let c = new URL(a.url).pathname;
          if (j.some(a => c.startsWith(a))) return b(a);
          let e = (function (a) {
            if (j.some(b => a.startsWith(b))) return 0;
            for (let [b, c] of Object.entries(i))
              if (
                '*' !== b &&
                RegExp('^' + b.replace(/\*/g, '.*') + '$').test(a)
              )
                return c;
            return i['*'];
          })(c);
          if (0 === e) return b(a);
          try {
            let f = (h || (h = new g()), h),
              i = (function (a) {
                let b = a.headers.get('x-forwarded-for');
                if (b) return b.split(',')[0].trim();
                let c = a.headers.get('x-real-ip');
                if (c) return c;
                let d = a.headers.get('cf-connecting-ip');
                return d || '127.0.0.1';
              })(a),
              j = f.getRoutePattern(c),
              k = await f.checkLimit(i, j, e);
            if (!k.allowed)
              return (
                console.warn(`Rate limit exceeded for IP ${i} on route ${j}`),
                new d.NextResponse(
                  JSON.stringify({
                    ok: !1,
                    error: 'rate_limit',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((k.resetTime - Date.now()) / 1e3),
                  }),
                  {
                    status: 429,
                    headers: {
                      'Content-Type': 'application/json',
                      'Retry-After': String(
                        Math.ceil((k.resetTime - Date.now()) / 1e3)
                      ),
                      'X-RateLimit-Limit': String(e),
                      'X-RateLimit-Remaining': String(k.remainingTokens),
                      'X-RateLimit-Reset': String(Math.ceil(k.resetTime / 1e3)),
                    },
                  }
                )
              );
            let l = await b(a);
            return (
              l.headers.set('X-RateLimit-Limit', String(e)),
              l.headers.set('X-RateLimit-Remaining', String(k.remainingTokens)),
              l.headers.set(
                'X-RateLimit-Reset',
                String(Math.ceil(k.resetTime / 1e3))
              ),
              l
            );
          } catch (c) {
            return (console.error('Rate limiting middleware error:', c), b(a));
          }
        }
      },
      29294: a => {
        'use strict';
        a.exports = require('next/dist/server/app-render/work-async-storage.external.js');
      },
      44870: a => {
        'use strict';
        a.exports = require('next/dist/compiled/next-server/app-route.runtime.prod.js');
      },
      55511: a => {
        'use strict';
        a.exports = require('crypto');
      },
      56161: () => {},
      63033: a => {
        'use strict';
        a.exports = require('next/dist/server/app-render/work-unit-async-storage.external.js');
      },
      69602: (a, b, c) => {
        'use strict';
        (c.r(b),
          c.d(b, {
            handler: () => D,
            patchFetch: () => C,
            routeModule: () => y,
            serverHooks: () => B,
            workAsyncStorage: () => z,
            workUnitAsyncStorage: () => A,
          }));
        var d = {};
        (c.r(d), c.d(d, { GET: () => x }));
        var e = c(70818),
          f = c(73659),
          g = c(27002),
          h = c(69532),
          i = c(40386),
          j = c(261),
          k = c(8404),
          l = c(92638),
          m = c(35254),
          n = c(92229),
          o = c(53203),
          p = c(29865),
          q = c(25183),
          r = c(7896),
          s = c(86439),
          t = c(15974),
          u = c(41315),
          v = c(55511),
          w = c(25578);
        async function x(a) {
          return (0, w.YO)(a, async a => {
            let b = (function () {
              try {
                return (0, v.randomUUID)();
              } catch {
                return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              }
            })();
            try {
              let c = new URL(a.url).origin,
                d = `${c}/api/healthz?probe=ready&deep=true`,
                e = await fetch(d, { headers: { 'X-Correlation-Id': b } }),
                f = await e
                  .json()
                  .catch(() => ({ status: 'unhealthy', checks: {} })),
                g = 'healthy' === f.status || 'degraded' === f.status,
                h = {
                  status: g ? 'READY' : 'NOT_READY',
                  reasons: g ? [] : ['unhealthy'],
                  checks: f.checks ?? {},
                  slo: {
                    stale_ratio_p95: 0,
                    shadow_rmse_max: 0,
                    read_latency_p95: 0,
                    quorum_fail_24h: 0,
                  },
                },
                i = u.NextResponse.json(h, { status: g ? 200 : 503 });
              return (
                i.headers.set('X-Correlation-Id', b),
                i.headers.set('Cache-Control', 'private, max-age=5'),
                i
              );
            } catch (c) {
              let a = u.NextResponse.json(
                {
                  status: 'NOT_READY',
                  reasons: ['exception'],
                  error: c.message,
                },
                { status: 503 }
              );
              return (
                a.headers.set('X-Correlation-Id', b),
                a.headers.set('Cache-Control', 'private, max-age=0'),
                a
              );
            }
          });
        }
        let y = new e.AppRouteRouteModule({
            definition: {
              kind: f.RouteKind.APP_ROUTE,
              page: '/api/oracle/v1/readiness/route',
              pathname: '/api/oracle/v1/readiness',
              filename: 'route',
              bundlePath: 'app/api/oracle/v1/readiness/route',
            },
            distDir: '.next-dev',
            relativeProjectDir: '',
            resolvedPagePath:
              '/home/parallels/Desktop/adaf-dashboard-pro/src/app/api/oracle/v1/readiness/route.ts',
            nextConfigOutput: '',
            userland: d,
          }),
          { workAsyncStorage: z, workUnitAsyncStorage: A, serverHooks: B } = y;
        function C() {
          return (0, g.patchFetch)({
            workAsyncStorage: z,
            workUnitAsyncStorage: A,
          });
        }
        async function D(a, b, c) {
          var d;
          let e = '/api/oracle/v1/readiness/route';
          '/index' === e && (e = '/');
          let g = await y.prepare(a, b, { srcPage: e, multiZoneDraftMode: !1 });
          if (!g)
            return (
              (b.statusCode = 400),
              b.end('Bad Request'),
              null == c.waitUntil || c.waitUntil.call(c, Promise.resolve()),
              null
            );
          let {
              buildId: u,
              params: v,
              nextConfig: w,
              isDraftMode: x,
              prerenderManifest: z,
              routerServerContext: A,
              isOnDemandRevalidate: B,
              revalidateOnlyGenerated: C,
              resolvedPathname: D,
            } = g,
            E = (0, j.normalizeAppPath)(e),
            F = !!(z.dynamicRoutes[E] || z.routes[D]);
          if (F && !x) {
            let a = !!z.routes[D],
              b = z.dynamicRoutes[E];
            if (b && !1 === b.fallback && !a) throw new s.NoFallbackError();
          }
          let G = null;
          !F || y.isDev || x || (G = '/index' === (G = D) ? '/' : G);
          let H = !0 === y.isDev || !F,
            I = F && !H,
            J = a.method || 'GET',
            K = (0, i.getTracer)(),
            L = K.getActiveScopeSpan(),
            M = {
              params: v,
              prerenderManifest: z,
              renderOpts: {
                experimental: {
                  cacheComponents: !!w.experimental.cacheComponents,
                  authInterrupts: !!w.experimental.authInterrupts,
                },
                supportsDynamicResponse: H,
                incrementalCache: (0, h.getRequestMeta)(a, 'incrementalCache'),
                cacheLifeProfiles:
                  null == (d = w.experimental) ? void 0 : d.cacheLife,
                isRevalidate: I,
                waitUntil: c.waitUntil,
                onClose: a => {
                  b.on('close', a);
                },
                onAfterTaskError: void 0,
                onInstrumentationRequestError: (b, c, d) =>
                  y.onRequestError(a, b, d, A),
              },
              sharedContext: { buildId: u },
            },
            N = new k.NodeNextRequest(a),
            O = new k.NodeNextResponse(b),
            P = l.NextRequestAdapter.fromNodeNextRequest(
              N,
              (0, l.signalFromNodeResponse)(b)
            );
          try {
            let d = async c =>
                y.handle(P, M).finally(() => {
                  if (!c) return;
                  c.setAttributes({
                    'http.status_code': b.statusCode,
                    'next.rsc': !1,
                  });
                  let d = K.getRootSpanAttributes();
                  if (!d) return;
                  if (
                    d.get('next.span_type') !== m.BaseServerSpan.handleRequest
                  )
                    return void console.warn(
                      `Unexpected root span type '${d.get('next.span_type')}'. Please report this Next.js issue https://github.com/vercel/next.js`
                    );
                  let e = d.get('next.route');
                  if (e) {
                    let a = `${J} ${e}`;
                    (c.setAttributes({
                      'next.route': e,
                      'http.route': e,
                      'next.span_name': a,
                    }),
                      c.updateName(a));
                  } else c.updateName(`${J} ${a.url}`);
                }),
              g = async g => {
                var i, j;
                let k = async ({ previousCacheEntry: f }) => {
                    try {
                      if (
                        !(0, h.getRequestMeta)(a, 'minimalMode') &&
                        B &&
                        C &&
                        !f
                      )
                        return (
                          (b.statusCode = 404),
                          b.setHeader('x-nextjs-cache', 'REVALIDATED'),
                          b.end('This page could not be found'),
                          null
                        );
                      let e = await d(g);
                      a.fetchMetrics = M.renderOpts.fetchMetrics;
                      let i = M.renderOpts.pendingWaitUntil;
                      i && c.waitUntil && (c.waitUntil(i), (i = void 0));
                      let j = M.renderOpts.collectedTags;
                      if (!F)
                        return (
                          await (0, o.I)(
                            N,
                            O,
                            e,
                            M.renderOpts.pendingWaitUntil
                          ),
                          null
                        );
                      {
                        let a = await e.blob(),
                          b = (0, p.toNodeOutgoingHttpHeaders)(e.headers);
                        (j && (b[r.NEXT_CACHE_TAGS_HEADER] = j),
                          !b['content-type'] &&
                            a.type &&
                            (b['content-type'] = a.type));
                        let c =
                            void 0 !== M.renderOpts.collectedRevalidate &&
                            !(
                              M.renderOpts.collectedRevalidate >=
                              r.INFINITE_CACHE
                            ) &&
                            M.renderOpts.collectedRevalidate,
                          d =
                            void 0 === M.renderOpts.collectedExpire ||
                            M.renderOpts.collectedExpire >= r.INFINITE_CACHE
                              ? void 0
                              : M.renderOpts.collectedExpire;
                        return {
                          value: {
                            kind: t.CachedRouteKind.APP_ROUTE,
                            status: e.status,
                            body: Buffer.from(await a.arrayBuffer()),
                            headers: b,
                          },
                          cacheControl: { revalidate: c, expire: d },
                        };
                      }
                    } catch (b) {
                      throw (
                        (null == f ? void 0 : f.isStale) &&
                          (await y.onRequestError(
                            a,
                            b,
                            {
                              routerKind: 'App Router',
                              routePath: e,
                              routeType: 'route',
                              revalidateReason: (0, n.c)({
                                isRevalidate: I,
                                isOnDemandRevalidate: B,
                              }),
                            },
                            A
                          )),
                        b
                      );
                    }
                  },
                  l = await y.handleResponse({
                    req: a,
                    nextConfig: w,
                    cacheKey: G,
                    routeKind: f.RouteKind.APP_ROUTE,
                    isFallback: !1,
                    prerenderManifest: z,
                    isRoutePPREnabled: !1,
                    isOnDemandRevalidate: B,
                    revalidateOnlyGenerated: C,
                    responseGenerator: k,
                    waitUntil: c.waitUntil,
                  });
                if (!F) return null;
                if (
                  (null == l || null == (i = l.value) ? void 0 : i.kind) !==
                  t.CachedRouteKind.APP_ROUTE
                )
                  throw Object.defineProperty(
                    Error(
                      `Invariant: app-route received invalid cache entry ${null == l || null == (j = l.value) ? void 0 : j.kind}`
                    ),
                    '__NEXT_ERROR_CODE',
                    { value: 'E701', enumerable: !1, configurable: !0 }
                  );
                ((0, h.getRequestMeta)(a, 'minimalMode') ||
                  b.setHeader(
                    'x-nextjs-cache',
                    B
                      ? 'REVALIDATED'
                      : l.isMiss
                        ? 'MISS'
                        : l.isStale
                          ? 'STALE'
                          : 'HIT'
                  ),
                  x &&
                    b.setHeader(
                      'Cache-Control',
                      'private, no-cache, no-store, max-age=0, must-revalidate'
                    ));
                let m = (0, p.fromNodeOutgoingHttpHeaders)(l.value.headers);
                return (
                  ((0, h.getRequestMeta)(a, 'minimalMode') && F) ||
                    m.delete(r.NEXT_CACHE_TAGS_HEADER),
                  !l.cacheControl ||
                    b.getHeader('Cache-Control') ||
                    m.get('Cache-Control') ||
                    m.set(
                      'Cache-Control',
                      (0, q.getCacheControlHeader)(l.cacheControl)
                    ),
                  await (0, o.I)(
                    N,
                    O,
                    new Response(l.value.body, {
                      headers: m,
                      status: l.value.status || 200,
                    })
                  ),
                  null
                );
              };
            L
              ? await g(L)
              : await K.withPropagatedContext(a.headers, () =>
                  K.trace(
                    m.BaseServerSpan.handleRequest,
                    {
                      spanName: `${J} ${a.url}`,
                      kind: i.SpanKind.SERVER,
                      attributes: { 'http.method': J, 'http.target': a.url },
                    },
                    g
                  )
                );
          } catch (b) {
            if (
              (b instanceof s.NoFallbackError ||
                (await y.onRequestError(a, b, {
                  routerKind: 'App Router',
                  routePath: E,
                  routeType: 'route',
                  revalidateReason: (0, n.c)({
                    isRevalidate: I,
                    isOnDemandRevalidate: B,
                  }),
                })),
              F)
            )
              throw b;
            return (
              await (0, o.I)(N, O, new Response(null, { status: 500 })),
              null
            );
          }
        }
      },
      86439: a => {
        'use strict';
        a.exports = require('next/dist/shared/lib/no-fallback-error.external');
      },
      92609: () => {},
    }));
  var b = require('../../../../../webpack-runtime.js');
  b.C(a);
  var c = b.X(0, [246, 6186, 6674], () => b((b.s = 69602)));
  module.exports = c;
})();
