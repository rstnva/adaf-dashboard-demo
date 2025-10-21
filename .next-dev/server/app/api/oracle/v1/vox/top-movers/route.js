(() => {
  var a = {};
  ((a.id = 9701),
    (a.ids = [9701]),
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
      51455: a => {
        'use strict';
        a.exports = require('node:fs/promises');
      },
      55511: a => {
        'use strict';
        a.exports = require('crypto');
      },
      56161: () => {},
      56507: (a, b, c) => {
        'use strict';
        (c.r(b),
          c.d(b, {
            handler: () => K,
            patchFetch: () => J,
            routeModule: () => F,
            serverHooks: () => I,
            workAsyncStorage: () => G,
            workUnitAsyncStorage: () => H,
          }));
        var d = {};
        (c.r(d), c.d(d, { GET: () => E }));
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
          w = c(25578),
          x = c(78314),
          y = c(51455),
          z = c.n(y),
          A = c(76760),
          B = c.n(A);
        let C = new Set(['1h', '24h', '7d']);
        async function D(a, b, c) {
          let d = B().join(
              process.cwd(),
              'services',
              'oracle-core',
              'mock',
              'fixtures',
              'vox'
            ),
            e = B().join(d, `top-movers.${a}.json`);
          try {
            let a = await z().readFile(e, 'utf8'),
              d = JSON.parse(a);
            return (Array.isArray(d) ? d : d.items)
              .filter(a => {
                if ('both' === c) return !0;
                let b = 'number' == typeof a.delta ? a.delta : 0;
                return 'gainers' === c ? b >= 0 : b < 0;
              })
              .slice(0, b);
          } catch (a) {
            return [
              {
                asset: 'btc',
                vpi_now: 75,
                vpi_prev: 60,
                delta: 15,
                z: 1.2,
                samples: 120,
                confidence: 0.82,
              },
              {
                asset: 'eth',
                vpi_now: 62,
                vpi_prev: 58,
                delta: 4,
                z: 0.5,
                samples: 95,
                confidence: 0.74,
              },
            ].slice(0, b);
          }
        }
        async function E(a) {
          return (0, w.YO)(a, async a => {
            let b = (function () {
                try {
                  return (0, v.randomUUID)();
                } catch {
                  return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                }
              })(),
              c = Date.now(),
              {
                window: d,
                limit: e,
                direction: f,
              } = (function (a) {
                let b = new URL(a.url).searchParams,
                  c = b.get('window') ?? '24h',
                  d = b.get('limit'),
                  e = b.get('direction') ?? 'both',
                  f = d ? Number(d) : 10;
                return {
                  window: c,
                  limit: Number.isFinite(f)
                    ? Math.min(Math.max(1, f), 100)
                    : 10,
                  direction: e,
                };
              })(a),
              g = a.headers.get('authorization');
            if (!g || !g.toLowerCase().startsWith('bearer ')) {
              let a = u.NextResponse.json(
                { error: 'unauthorized', message: 'Bearer token required' },
                { status: 401 }
              );
              return (
                a.headers.set('X-Correlation-Id', b),
                a.headers.set('Cache-Control', 'private, max-age=0'),
                a
              );
            }
            if (!C.has(d)) {
              let a = u.NextResponse.json(
                { error: 'bad_request', message: `Invalid window: ${d}` },
                { status: 400 }
              );
              return (
                a.headers.set('X-Correlation-Id', b),
                a.headers.set('Cache-Control', 'private, max-age=0'),
                a
              );
            }
            if (!['gainers', 'losers', 'both'].includes(f)) {
              let a = u.NextResponse.json(
                { error: 'bad_request', message: `Invalid direction: ${f}` },
                { status: 400 }
              );
              return (
                a.headers.set('X-Correlation-Id', b),
                a.headers.set('Cache-Control', 'private, max-age=0'),
                a
              );
            }
            let h =
                'true' === process.env.VOX_TOP_MOVERS_MOCK ||
                'mock' === process.env.ORACLE_SOURCE_MODE,
              i = h ? 'private, max-age=0' : 'private, max-age=30';
            try {
              let a = [];
              if (h) a = await D(d, e, f);
              else {
                let a = u.NextResponse.json(
                  {
                    error: 'circuit_open',
                    message:
                      'Top movers data source not available (shadow/dry-run only)',
                  },
                  { status: 503 }
                );
                return (
                  a.headers.set('X-Correlation-Id', b),
                  a.headers.set('Cache-Control', i),
                  a
                );
              }
              x.v.info('vox.top-movers served', {
                correlationId: b,
                window: d,
                limit: e,
                direction: f,
                durationMs: Date.now() - c,
              });
              let g = u.NextResponse.json(
                { window: d, limit: e, direction: f, items: a },
                { status: 200 }
              );
              return (
                g.headers.set('X-Correlation-Id', b),
                g.headers.set('Cache-Control', i),
                g
              );
            } catch (c) {
              x.v.error('vox.top-movers failed', {
                correlationId: b,
                message: c.message,
              });
              let a = u.NextResponse.json(
                {
                  error: 'internal_error',
                  message: 'Failed to compute top movers',
                },
                { status: 500 }
              );
              return (
                a.headers.set('X-Correlation-Id', b),
                a.headers.set('Cache-Control', 'private, max-age=0'),
                a
              );
            }
          });
        }
        let F = new e.AppRouteRouteModule({
            definition: {
              kind: f.RouteKind.APP_ROUTE,
              page: '/api/oracle/v1/vox/top-movers/route',
              pathname: '/api/oracle/v1/vox/top-movers',
              filename: 'route',
              bundlePath: 'app/api/oracle/v1/vox/top-movers/route',
            },
            distDir: '.next-dev',
            relativeProjectDir: '',
            resolvedPagePath:
              '/home/parallels/Desktop/adaf-dashboard-pro/src/app/api/oracle/v1/vox/top-movers/route.ts',
            nextConfigOutput: '',
            userland: d,
          }),
          { workAsyncStorage: G, workUnitAsyncStorage: H, serverHooks: I } = F;
        function J() {
          return (0, g.patchFetch)({
            workAsyncStorage: G,
            workUnitAsyncStorage: H,
          });
        }
        async function K(a, b, c) {
          var d;
          let e = '/api/oracle/v1/vox/top-movers/route';
          '/index' === e && (e = '/');
          let g = await F.prepare(a, b, { srcPage: e, multiZoneDraftMode: !1 });
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
              prerenderManifest: y,
              routerServerContext: z,
              isOnDemandRevalidate: A,
              revalidateOnlyGenerated: B,
              resolvedPathname: C,
            } = g,
            D = (0, j.normalizeAppPath)(e),
            E = !!(y.dynamicRoutes[D] || y.routes[C]);
          if (E && !x) {
            let a = !!y.routes[C],
              b = y.dynamicRoutes[D];
            if (b && !1 === b.fallback && !a) throw new s.NoFallbackError();
          }
          let G = null;
          !E || F.isDev || x || (G = '/index' === (G = C) ? '/' : G);
          let H = !0 === F.isDev || !E,
            I = E && !H,
            J = a.method || 'GET',
            K = (0, i.getTracer)(),
            L = K.getActiveScopeSpan(),
            M = {
              params: v,
              prerenderManifest: y,
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
                  F.onRequestError(a, b, d, z),
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
                F.handle(P, M).finally(() => {
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
                        A &&
                        B &&
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
                      if (!E)
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
                          (await F.onRequestError(
                            a,
                            b,
                            {
                              routerKind: 'App Router',
                              routePath: e,
                              routeType: 'route',
                              revalidateReason: (0, n.c)({
                                isRevalidate: I,
                                isOnDemandRevalidate: A,
                              }),
                            },
                            z
                          )),
                        b
                      );
                    }
                  },
                  l = await F.handleResponse({
                    req: a,
                    nextConfig: w,
                    cacheKey: G,
                    routeKind: f.RouteKind.APP_ROUTE,
                    isFallback: !1,
                    prerenderManifest: y,
                    isRoutePPREnabled: !1,
                    isOnDemandRevalidate: A,
                    revalidateOnlyGenerated: B,
                    responseGenerator: k,
                    waitUntil: c.waitUntil,
                  });
                if (!E) return null;
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
                    A
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
                  ((0, h.getRequestMeta)(a, 'minimalMode') && E) ||
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
                (await F.onRequestError(a, b, {
                  routerKind: 'App Router',
                  routePath: D,
                  routeType: 'route',
                  revalidateReason: (0, n.c)({
                    isRevalidate: I,
                    isOnDemandRevalidate: A,
                  }),
                })),
              E)
            )
              throw b;
            return (
              await (0, o.I)(N, O, new Response(null, { status: 500 })),
              null
            );
          }
        }
      },
      63033: a => {
        'use strict';
        a.exports = require('next/dist/server/app-render/work-unit-async-storage.external.js');
      },
      76760: a => {
        'use strict';
        a.exports = require('node:path');
      },
      78314: (a, b, c) => {
        'use strict';
        c.d(b, { v: () => e });
        class d {
          constructor() {
            this.minLevel = 'info';
            let a = process.env.LOG_LEVEL?.toLowerCase();
            a &&
              ['debug', 'info', 'warn', 'error'].includes(a) &&
              (this.minLevel = a);
          }
          shouldLog(a) {
            let b = { debug: 0, info: 1, warn: 2, error: 3 };
            return b[a] >= b[this.minLevel];
          }
          formatMessage(a) {
            let b = a.timestamp.toISOString(),
              c = a.level.toUpperCase().padEnd(5),
              d = `[${b}] ${c} ${a.message}`;
            return (a.context && (d += ` ${JSON.stringify(a.context)}`), d);
          }
          log(a, b, c) {
            if (!this.shouldLog(a)) return;
            let d = { level: a, message: b, timestamp: new Date(), context: c },
              e = this.formatMessage(d);
            switch (a) {
              case 'error':
                console.error(e);
                break;
              case 'warn':
                console.warn(e);
                break;
              case 'debug':
                console.debug(e);
                break;
              default:
                console.log(e);
            }
          }
          debug(a, b) {
            this.log('debug', a, b);
          }
          info(a, b) {
            this.log('info', a, b);
          }
          warn(a, b) {
            this.log('warn', a, b);
          }
          error(a, b) {
            this.log('error', a, b);
          }
          apiCall(a, b, c) {
            this.info(`API ${a} ${b}`, { duration: c });
          }
          dbQuery(a, b) {
            this.debug(`DB Query: ${a}`, { duration: b });
          }
          authEvent(a, b) {
            this.info(`Auth: ${a}`, { userId: b });
          }
        }
        let e = new d();
      },
      86439: a => {
        'use strict';
        a.exports = require('next/dist/shared/lib/no-fallback-error.external');
      },
      92609: () => {},
    }));
  var b = require('../../../../../../webpack-runtime.js');
  b.C(a);
  var c = b.X(0, [246, 6186, 6674], () => b((b.s = 56507)));
  module.exports = c;
})();
