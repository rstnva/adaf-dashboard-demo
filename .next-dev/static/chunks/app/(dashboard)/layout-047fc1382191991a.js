(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [9305],
  {
    12686: (e, t, a) => {
      'use strict';
      a.d(t, { p: () => i });
      var s = a(51833);
      a(59693);
      var r = a(81429);
      function i(e) {
        let { className: t, type: a, ...i } = e;
        return (0, s.jsx)('input', {
          type: a,
          'data-slot': 'input',
          className: (0, r.cn)(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            t
          ),
          ...i,
        });
      }
    },
    27609: (e, t, a) => {
      'use strict';
      a.d(t, { dB: () => u, vC: () => p });
      var s = a(59693),
        r = a(83738);
      let i = navigator.platform.toUpperCase().indexOf('MAC') >= 0,
        o = i ? '⌘' : 'Ctrl',
        n = i ? 'metaKey' : 'ctrlKey',
        c = [
          {
            key: 'k',
            modifiers: [n],
            description: 'Open Spotlight Search',
            action: 'spotlight:open',
            preventDefault: !0,
          },
          {
            key: 'j',
            modifiers: [n],
            description: 'Toggle Theme',
            action: 'theme:toggle',
            preventDefault: !0,
          },
          {
            key: 'r',
            modifiers: [n],
            description: 'Run Worker (with confirmation)',
            action: 'worker:run',
            preventDefault: !0,
          },
          {
            key: '?',
            modifiers: [],
            description: 'Show Keyboard Shortcuts Help',
            action: 'help:shortcuts',
            preventDefault: !0,
          },
          {
            key: 'g',
            modifiers: [],
            description: 'Go to... (press g then:',
            action: 'goto:prepare',
            context: 'global',
          },
          {
            key: '1',
            modifiers: [n],
            description: 'Focus Top Strip (KPIs)',
            action: 'focus:kpi-strip',
            preventDefault: !0,
          },
          {
            key: '2',
            modifiers: [n],
            description: 'Focus ETF Autoswitch Card',
            action: 'focus:etf-card',
            preventDefault: !0,
          },
          {
            key: '3',
            modifiers: [n],
            description: 'Focus Research Card',
            action: 'focus:research-card',
            preventDefault: !0,
          },
          {
            key: '4',
            modifiers: [n],
            description: 'Focus OP-X Card',
            action: 'focus:opx-card',
            preventDefault: !0,
          },
          {
            key: '5',
            modifiers: [n],
            description: 'Focus Reports Card',
            action: 'focus:reports-card',
            preventDefault: !0,
          },
          {
            key: '6',
            modifiers: [n],
            description: 'Focus Risk Card',
            action: 'focus:risk-card',
            preventDefault: !0,
          },
          {
            key: '7',
            modifiers: [n],
            description: 'Focus DQP Card',
            action: 'focus:dqp-card',
            preventDefault: !0,
          },
        ],
        l = [
          {
            key: 'Enter',
            modifiers: [n],
            description: 'Run Backtest',
            action: 'research:run',
            context: 'research',
            preventDefault: !0,
          },
          {
            key: 's',
            modifiers: [n],
            description: 'Save Config Preset',
            action: 'research:save',
            context: 'research',
            preventDefault: !0,
          },
          {
            key: 'c',
            modifiers: ['shiftKey'],
            description: 'Create Snapshot',
            action: 'research:snapshot',
            context: 'research',
            preventDefault: !0,
          },
        ],
        d = {
          m: { route: '/markets', description: 'Markets' },
          o: { route: '/onchain', description: 'On-Chain Analytics' },
          d: { route: '/derivatives', description: 'Derivatives' },
          n: { route: '/news', description: 'News & Research' },
          r: { route: '/research', description: 'Research Hub' },
          a: { route: '/academy', description: 'Academy' },
          x: { route: '/opx', description: 'OP-X Opportunities' },
          p: { route: '/reports', description: 'Reports' },
          q: { route: '/dqp', description: 'Data Quality' },
          l: { route: '/lineage', description: 'Data Lineage' },
          c: { route: '/control', description: 'Control Panel' },
          h: { route: '/', description: 'Home Dashboard' },
        },
        u = (e, t, a) => {
          try {
            fetch('/api/metrics/ui/event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                category: e,
                action: t,
                context: a,
                timestamp: new Date().toISOString(),
              }),
            }).catch(() => {});
          } catch (e) {}
        };
      function p() {
        let e =
            arguments.length > 0 && void 0 !== arguments[0]
              ? arguments[0]
              : 'global',
          t = arguments.length > 1 ? arguments[1] : void 0,
          a = (0, r.useRouter)(),
          i = (0, s.useRef)(!1),
          n = (0, s.useRef)(null),
          p = (0, s.useCallback)(() => {
            let e = document.activeElement;
            if (!e) return !1;
            let t = e.tagName.toLowerCase(),
              a = 'true' === e.getAttribute('contenteditable');
            return ['input', 'textarea', 'select'].includes(t) || a;
          }, []),
          m = (0, s.useCallback)(
            (a, s) => {
              var r, o, c, l, d, p, m;
              switch ((u('Hotkey', a, { context: e, data: s }), a)) {
                case 'spotlight:open':
                  window.dispatchEvent(new CustomEvent('spotlight:open'));
                  break;
                case 'theme:toggle':
                  window.dispatchEvent(new CustomEvent('theme:toggle'));
                  break;
                case 'worker:run':
                  window.confirm(
                    'Run background worker once? This may affect system performance briefly.'
                  ) &&
                    fetch('/api/ops/worker/run', { method: 'POST' })
                      .then(() => {})
                      .catch(() => {
                        alert(
                          'Failed to run worker. Check console for details.'
                        );
                      });
                  break;
                case 'help:shortcuts':
                  window.dispatchEvent(
                    new CustomEvent('help:show', { detail: 'shortcuts' })
                  );
                  break;
                case 'goto:prepare':
                  ((i.current = !0),
                    n.current && clearTimeout(n.current),
                    (n.current = window.setTimeout(() => {
                      i.current = !1;
                    }, 2e3)));
                  break;
                case 'focus:kpi-strip':
                  null == (r = document.getElementById('kpi-strip')) ||
                    r.focus();
                  break;
                case 'focus:etf-card':
                  null ==
                    (o = document.getElementById('etf-autoswitch-card')) ||
                    o.focus();
                  break;
                case 'focus:research-card':
                  null == (c = document.getElementById('research-card')) ||
                    c.focus();
                  break;
                case 'focus:opx-card':
                  null == (l = document.getElementById('opx-card')) ||
                    l.focus();
                  break;
                case 'focus:reports-card':
                  null == (d = document.getElementById('reports-card')) ||
                    d.focus();
                  break;
                case 'focus:risk-card':
                  null == (p = document.getElementById('risk-card')) ||
                    p.focus();
                  break;
                case 'focus:dqp-card':
                  null == (m = document.getElementById('dqp-card')) ||
                    m.focus();
                  break;
                default:
                  null == t || t(a, s);
              }
            },
            [t, e]
          ),
          h = (0, s.useCallback)(
            t => {
              if (p()) return;
              let s = t.key.toLowerCase();
              if (i.current) {
                let e = d[s];
                if (e) {
                  (t.preventDefault(),
                    (i.current = !1),
                    n.current && clearTimeout(n.current),
                    u('Navigation', 'Goto', { route: e.route, key: s }),
                    a.push(e.route));
                  return;
                }
                i.current = !1;
                return;
              }
              for (let a of [...c, ...('research' === e ? l : [])])
                if (a.key.toLowerCase() === s) {
                  let e = a.modifiers.every(e => {
                      switch (e) {
                        case 'ctrlKey':
                          return t.ctrlKey;
                        case 'metaKey':
                          return t.metaKey;
                        case 'altKey':
                          return t.altKey;
                        case 'shiftKey':
                          return t.shiftKey;
                        default:
                          return !1;
                      }
                    }),
                    s =
                      (a.modifiers.includes('ctrlKey') ? 0 : +!!t.ctrlKey) +
                      (a.modifiers.includes('metaKey') ? 0 : +!!t.metaKey) +
                      (a.modifiers.includes('altKey') ? 0 : +!!t.altKey) +
                      (a.modifiers.includes('shiftKey') ? 0 : +!!t.shiftKey);
                  if (e && 0 === s) {
                    (a.preventDefault && t.preventDefault(), m(a.action));
                    break;
                  }
                }
            },
            [p, m, a, e]
          );
        return (
          (0, s.useEffect)(
            () => (
              document.addEventListener('keydown', h),
              () => {
                (document.removeEventListener('keydown', h),
                  n.current && clearTimeout(n.current));
              }
            ),
            [h]
          ),
          (0, s.useEffect)(
            () => () => {
              n.current && clearTimeout(n.current);
            },
            []
          ),
          { executeAction: m, modifierKey: o, isGotoMode: i.current }
        );
      }
    },
    32426: (e, t, a) => {
      'use strict';
      a.d(t, { TopBar: () => k });
      var s = a(51833),
        r = a(59693),
        i = a(11622),
        o = a(33399),
        n = a(1372),
        c = a(2056),
        l = a(34510),
        d = a(40503),
        u = a(74122),
        p = a(64780),
        m = a(34892),
        h = a(76507),
        g = a(95479),
        x = a(94804),
        f = a(81429),
        b = a(80353);
      let y = [
          { symbol: 'BTC', name: 'Bitcoin', color: 'bg-orange-500' },
          { symbol: 'ETH', name: 'Ethereum', color: 'bg-blue-500' },
          { symbol: 'SOL', name: 'Solana', color: 'bg-purple-500' },
          { symbol: 'AVAX', name: 'Avalanche', color: 'bg-red-500' },
          { symbol: 'MATIC', name: 'Polygon', color: 'bg-indigo-500' },
        ],
        v = [
          { value: '1D', label: '1 D\xeda' },
          { value: '7D', label: '7 D\xedas' },
          { value: '30D', label: '30 D\xedas' },
          { value: '90D', label: '90 D\xedas' },
          { value: '1Y', label: '1 A\xf1o' },
        ],
        w = [
          { value: 'USD', label: 'USD', symbol: '$' },
          { value: 'MXN', label: 'MXN', symbol: '$' },
        ],
        j = [
          {
            value: 'America/Mexico_City',
            label: 'Ciudad de M\xe9xico',
            short: 'CST',
          },
          { value: 'America/New_York', label: 'Nueva York', short: 'EST' },
          { value: 'Europe/London', label: 'Londres', short: 'GMT' },
          { value: 'Asia/Tokyo', label: 'Tokio', short: 'JST' },
        ];
      function k() {
        var e;
        let { children: t } =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          {
            selectedAssets: a,
            range: k,
            currency: N,
            timezone: A,
            setSelectedAssets: S,
            setRange: C,
            setCurrency: E,
            setTimezone: D,
            getFormattedAsOf: P,
          } = (0, x.j)(),
          [O, T] = (0, r.useState)(!1),
          [R, I] = (0, r.useState)(!1),
          [L, z] = (0, r.useState)(!1),
          [F, K] = (0, r.useState)(!1),
          [q, _] = (0, r.useState)(!1),
          [M, V] = (0, r.useState)(!1),
          [B, G] = (0, r.useState)(!1),
          [$, W] = (0, r.useState)('—'),
          [U, Y] = (0, r.useState)('Ctrl'),
          [H, X] = (0, r.useState)(() => {
            let e = window.localStorage.getItem('pageguide:always');
            return null === e || ('0' !== e && 'false' !== e);
          }),
          J = async () => {
            _(!0);
            try {
              if (
                !(
                  await fetch('/api/actions/run-worker-once', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  })
                ).ok
              )
                throw Error('Failed to run worker');
              fetch('/api/metrics/ui/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  component: 'TopBar',
                  action: 'run_worker_once',
                  timestamp: new Date().toISOString(),
                }),
              }).catch(console.error);
            } catch (e) {
              console.error('Failed to run worker:', e);
            } finally {
              _(!1);
            }
          },
          Q = async () => {
            V(!0);
            try {
              let e = await fetch('/api/generate/report/onepager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actor: 'local-user',
                  notes: 'Assets: '
                    .concat(a.join(', '), ' | Range: ')
                    .concat(k, ' | Currency: ')
                    .concat(N, ' | TZ: ')
                    .concat(A),
                  period: 'q',
                }),
              });
              if (!e.ok) throw Error('Failed to generate report');
              let t = await e.blob(),
                s = window.URL.createObjectURL(t),
                r = document.createElement('a'),
                i =
                  e.headers.get('Content-Disposition') ||
                  e.headers.get('content-disposition'),
                o = 'ADAF_OnePager_'.concat(
                  new Date().toISOString().split('T')[0],
                  '.pdf'
                );
              if (i) {
                let e = i.match(/filename="?([^";]+)"?/i);
                (null == e ? void 0 : e[1]) && (o = e[1]);
              }
              ((r.href = s),
                (r.download = o),
                document.body.appendChild(r),
                r.click(),
                r.remove(),
                setTimeout(() => URL.revokeObjectURL(s), 1e3),
                fetch('/api/metrics/ui/event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    component: 'TopBar',
                    action: 'generate_one_pager',
                    timestamp: new Date().toISOString(),
                  }),
                }).catch(console.error));
              let n = document.createElement('div');
              ((n.className =
                'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50'),
                (n.textContent = 'Reporte generado y descargado'),
                document.body.appendChild(n),
                setTimeout(() => document.body.removeChild(n), 2e3));
            } catch (e) {
              console.error('Failed to generate report:', e);
            } finally {
              V(!1);
            }
          };
        return (
          (0, r.useEffect)(() => {
            G(!0);
            try {
              W(P());
            } catch (e) {
              W('—');
            }
            try {
              var e;
              let t =
                'undefined' != typeof navigator &&
                (null == (e = navigator.platform)
                  ? void 0
                  : e.toUpperCase().includes('MAC'));
              Y(t ? '⌘' : 'Ctrl');
            } catch (e) {
              Y('Ctrl');
            }
          }, [P]),
          (0, s.jsx)('div', {
            className: 'sticky top-0 z-50 px-6 pt-6',
            children: (0, s.jsxs)('div', {
              className: 'glass-panel flex h-[88px] items-center gap-6 px-6',
              children: [
                (0, s.jsxs)('div', {
                  className: 'flex items-center gap-3',
                  children: [
                    (0, s.jsxs)('div', {
                      className: 'relative',
                      children: [
                        (0, s.jsxs)(i.$, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: () => T(!O),
                          className:
                            'h-10 min-w-[140px] justify-between rounded-2xl border-white/20 bg-white/10 text-slate-100 hover:bg-white/16',
                          children: [
                            (0, s.jsxs)('div', {
                              className: 'flex items-center gap-1.5',
                              children: [
                                a.slice(0, 2).map(e => {
                                  let t = y.find(t => t.symbol === e);
                                  return (0, s.jsx)(
                                    'div',
                                    {
                                      className: (0, f.cn)(
                                        'h-2.5 w-2.5 rounded-full',
                                        null == t ? void 0 : t.color
                                      ),
                                    },
                                    e
                                  );
                                }),
                                (0, s.jsx)('span', {
                                  className:
                                    'ml-2 font-semibold tracking-tight',
                                  children:
                                    1 === a.length
                                      ? a[0]
                                      : ''.concat(a.length, ' Assets'),
                                }),
                              ],
                            }),
                            (0, s.jsx)(n.A, {
                              className: 'h-4 w-4 opacity-70',
                            }),
                          ],
                        }),
                        O &&
                          (0, s.jsxs)('div', {
                            className:
                              'glass-panel absolute top-full mt-3 w-64 rounded-2xl border-white/20 bg-slate-900/70 p-4 text-slate-100',
                            children: [
                              (0, s.jsxs)('div', {
                                className: 'space-y-3',
                                children: [
                                  (0, s.jsx)('h4', {
                                    className:
                                      'text-sm font-semibold uppercase tracking-[0.3em] text-slate-300/70',
                                    children: 'Assets',
                                  }),
                                  y.map(e =>
                                    (0, s.jsx)(
                                      'label',
                                      {
                                        className:
                                          'flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:border-white/25',
                                        children: (0, s.jsxs)('div', {
                                          className: 'flex items-center gap-2',
                                          children: [
                                            (0, s.jsx)('input', {
                                              type: 'checkbox',
                                              checked: a.includes(e.symbol),
                                              onChange: () => {
                                                var t;
                                                return (
                                                  (t = e.symbol),
                                                  void (a.includes(t)
                                                    ? a.length > 1 &&
                                                      S(a.filter(e => e !== t))
                                                    : S([...a, t]))
                                                );
                                              },
                                              className:
                                                'h-4 w-4 rounded border-white/30 bg-transparent text-sky-400 focus:ring-sky-400/60',
                                            }),
                                            (0, s.jsx)('div', {
                                              className: (0, f.cn)(
                                                'h-3 w-3 rounded-full',
                                                e.color
                                              ),
                                            }),
                                            (0, s.jsxs)('span', {
                                              children: [
                                                e.name,
                                                ' (',
                                                e.symbol,
                                                ')',
                                              ],
                                            }),
                                          ],
                                        }),
                                      },
                                      e.symbol
                                    )
                                  ),
                                ],
                              }),
                              (0, s.jsx)('div', {
                                className: 'mt-4 flex justify-end',
                                children: (0, s.jsx)(i.$, {
                                  size: 'sm',
                                  onClick: () => T(!1),
                                  className:
                                    'rounded-xl bg-white/15 px-4 text-slate-100 hover:bg-white/25',
                                  children: 'Done',
                                }),
                              }),
                            ],
                          }),
                      ],
                    }),
                    (0, s.jsxs)('div', {
                      className: 'relative',
                      children: [
                        (0, s.jsxs)(i.$, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: () => I(!R),
                          className:
                            'h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-slate-100 hover:bg-white/16',
                          children: [
                            (0, s.jsx)(c.A, { className: 'h-4 w-4' }),
                            (0, s.jsx)('span', {
                              className: 'ml-2 font-semibold',
                              children: k,
                            }),
                            (0, s.jsx)(n.A, {
                              className: 'ml-1 h-4 w-4 opacity-70',
                            }),
                          ],
                        }),
                        R &&
                          (0, s.jsx)('div', {
                            className:
                              'glass-panel absolute top-full mt-3 w-36 rounded-2xl border-white/20 bg-slate-900/70 py-2 text-sm text-slate-100',
                            children: v.map(e =>
                              (0, s.jsx)(
                                'button',
                                {
                                  onClick: () => {
                                    (C(e.value), I(!1));
                                  },
                                  className: (0, f.cn)(
                                    'flex w-full items-center justify-between px-4 py-2 hover:bg-white/10',
                                    k === e.value && 'text-sky-300'
                                  ),
                                  children: e.label,
                                },
                                e.value
                              )
                            ),
                          }),
                      ],
                    }),
                    (0, s.jsxs)('div', {
                      className: 'relative',
                      children: [
                        (0, s.jsxs)(i.$, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: () => z(!L),
                          className:
                            'h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-slate-100 hover:bg-white/16',
                          children: [
                            (0, s.jsx)(l.A, { className: 'h-4 w-4' }),
                            (0, s.jsx)('span', {
                              className: 'ml-2 font-semibold',
                              children: N,
                            }),
                            (0, s.jsx)(n.A, {
                              className: 'ml-1 h-4 w-4 opacity-70',
                            }),
                          ],
                        }),
                        L &&
                          (0, s.jsx)('div', {
                            className:
                              'glass-panel absolute top-full mt-3 w-28 rounded-2xl border-white/20 bg-slate-900/70 py-2 text-sm text-slate-100',
                            children: w.map(e =>
                              (0, s.jsx)(
                                'button',
                                {
                                  onClick: () => {
                                    (E(e.value), z(!1));
                                  },
                                  className: (0, f.cn)(
                                    'flex w-full items-center justify-between px-4 py-2 hover:bg-white/10',
                                    N === e.value && 'text-sky-300'
                                  ),
                                  children: e.label,
                                },
                                e.value
                              )
                            ),
                          }),
                      ],
                    }),
                    (0, s.jsxs)('div', {
                      className: 'relative',
                      children: [
                        (0, s.jsxs)(i.$, {
                          variant: 'outline',
                          size: 'sm',
                          onClick: () => K(!F),
                          className:
                            'h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-slate-100 hover:bg-white/16',
                          children: [
                            (0, s.jsx)(d.A, { className: 'h-4 w-4' }),
                            (0, s.jsx)('span', {
                              className: 'ml-2 font-semibold',
                              children:
                                null == (e = j.find(e => e.value === A))
                                  ? void 0
                                  : e.short,
                            }),
                            (0, s.jsx)(n.A, {
                              className: 'ml-1 h-4 w-4 opacity-70',
                            }),
                          ],
                        }),
                        F &&
                          (0, s.jsx)('div', {
                            className:
                              'glass-panel absolute top-full mt-3 w-60 rounded-2xl border-white/20 bg-slate-900/70 py-3 text-sm text-slate-100',
                            children: j.map(e =>
                              (0, s.jsxs)(
                                'button',
                                {
                                  onClick: () => {
                                    (D(e.value), K(!1));
                                  },
                                  className: (0, f.cn)(
                                    'flex w-full items-center justify-between px-4 py-2 hover:bg-white/10',
                                    A === e.value && 'text-sky-300'
                                  ),
                                  children: [
                                    (0, s.jsx)('span', { children: e.label }),
                                    (0, s.jsx)('span', {
                                      className: 'text-xs text-slate-300/70',
                                      children: e.short,
                                    }),
                                  ],
                                },
                                e.value
                              )
                            ),
                          }),
                      ],
                    }),
                    (0, s.jsxs)(o.E, {
                      variant: 'outline',
                      className:
                        'border-white/20 bg-white/5 px-4 text-xs text-slate-200/80',
                      children: ['as of ', B ? $ : '—'],
                    }),
                  ],
                }),
                (0, s.jsx)('div', {
                  className: 'flex-1 max-w-lg',
                  children: (0, s.jsxs)(i.$, {
                    variant: 'outline',
                    onClick: () =>
                      window.dispatchEvent(new CustomEvent('spotlight:open')),
                    className:
                      'group w-full justify-start rounded-2xl border-white/20 bg-white/8 px-4 py-3 text-sm text-slate-300/90 hover:border-white/30 hover:bg-white/14 hover:text-white',
                    children: [
                      (0, s.jsx)(u.A, {
                        className:
                          'mr-3 h-4 w-4 text-sky-300 group-hover:text-sky-200',
                      }),
                      (0, s.jsx)('span', {
                        children: 'B\xfasqueda Spotlight...',
                      }),
                      (0, s.jsxs)('div', {
                        className:
                          'ml-auto flex items-center gap-1 text-[11px] text-slate-400/80',
                        children: [
                          (0, s.jsx)('kbd', {
                            className:
                              'rounded-lg border border-white/20 bg-white/10 px-2 py-1',
                            children: U,
                          }),
                          (0, s.jsx)('kbd', {
                            className:
                              'rounded-lg border border-white/20 bg-white/10 px-2 py-1',
                            children: 'K',
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                (0, s.jsxs)('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    (0, s.jsxs)(i.$, {
                      size: 'sm',
                      variant: H ? 'default' : 'outline',
                      onClick: () => {
                        let e = !H;
                        X(e);
                        try {
                          (window.localStorage.setItem(
                            'pageguide:always',
                            e ? '1' : '0'
                          ),
                            window.dispatchEvent(
                              new Event('pageguide:always-changed')
                            ));
                        } catch (e) {
                          console.warn(
                            'Failed to persist PageGuide preference',
                            e
                          );
                        }
                      },
                      className: 'rounded-2xl px-4',
                      children: [
                        (0, s.jsx)(b.A, { className: 'mr-1 h-4 w-4' }),
                        H ? 'Gu\xedas: ON' : 'Gu\xedas: OFF',
                      ],
                    }),
                    (0, s.jsxs)(i.$, {
                      size: 'sm',
                      onClick: J,
                      disabled: q,
                      className:
                        'rounded-2xl bg-emerald-500/20 px-4 text-emerald-100 hover:bg-emerald-500/30',
                      children: [
                        (0, s.jsx)(p.A, { className: 'mr-1 h-4 w-4' }),
                        q ? 'Running...' : 'Run Worker',
                      ],
                    }),
                    (0, s.jsxs)(i.$, {
                      size: 'sm',
                      variant: 'outline',
                      onClick: Q,
                      disabled: M,
                      className:
                        'rounded-2xl border-white/20 px-4 text-slate-200 hover:border-white/35 hover:text-white',
                      children: [
                        (0, s.jsx)(m.A, { className: 'mr-1 h-4 w-4' }),
                        M ? 'Generating...' : 'One-Pager',
                      ],
                    }),
                    (0, s.jsxs)(i.$, {
                      size: 'sm',
                      variant: 'outline',
                      className:
                        'relative rounded-2xl border-white/20 px-3 text-slate-200 hover:border-white/30',
                      children: [
                        (0, s.jsx)(h.A, { className: 'h-4 w-4' }),
                        (0, s.jsx)(o.E, {
                          className:
                            'absolute -top-2 -right-1 h-5 w-5 rounded-full border-white/20 bg-rose-500/60 text-[11px] text-white',
                          children: '3',
                        }),
                      ],
                    }),
                    (0, s.jsx)(i.$, {
                      size: 'sm',
                      variant: 'outline',
                      className:
                        'rounded-2xl border-white/20 px-3 text-slate-200 hover:border-white/30',
                      children: (0, s.jsx)(g.A, { className: 'h-4 w-4' }),
                    }),
                    t,
                  ],
                }),
              ],
            }),
          })
        );
      }
    },
    33399: (e, t, a) => {
      'use strict';
      a.d(t, { E: () => n });
      var s = a(51833);
      a(59693);
      var r = a(49639),
        i = a(81429);
      let o = (0, r.F)(
        'inline-flex items-center rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_12px_30px_-18px_rgba(250,204,21,0.65)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:ring-offset-2',
        {
          variants: {
            variant: {
              default:
                'border-amber-300/40 bg-amber-500/20 text-zinc-900 hover:bg-amber-400/30',
              secondary:
                'border-zinc-700/40 bg-zinc-900/60 text-amber-100/80 hover:bg-zinc-800/60',
              destructive:
                'border-rose-500/50 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30',
              outline:
                'border-amber-200/40 bg-transparent text-amber-100/80 hover:border-amber-200/60',
            },
          },
          defaultVariants: { variant: 'default' },
        }
      );
      function n(e) {
        let { className: t, variant: a, ...r } = e;
        return (0, s.jsx)('div', {
          className: (0, i.cn)(o({ variant: a }), t),
          ...r,
        });
      }
    },
    46272: (e, t, a) => {
      'use strict';
      a.d(t, { HotkeyProvider: () => i });
      var s = a(51833),
        r = a(27609);
      function i(e) {
        let { children: t, context: a = 'global' } = e;
        return ((0, r.vC)(a), (0, s.jsx)(s.Fragment, { children: t }));
      }
    },
    55582: (e, t, a) => {
      'use strict';
      a.d(t, { NavLeft: () => O });
      var s = a(51833);
      a(59693);
      var r = a(30249),
        i = a.n(r),
        o = a(83738),
        n = a(53255),
        c = a(11622),
        l = a(81429),
        d = a(94804),
        u = a(72114),
        p = a(80571),
        m = a(28390),
        h = a(37572),
        g = a(45479),
        x = a(27367),
        f = a(10209),
        b = a(74122),
        y = a(70923),
        v = a(34892),
        w = a(89611),
        j = a(88477),
        k = a(31479),
        N = a(72395),
        A = a(95479),
        S = a(92503),
        C = a(9262),
        E = a(51725),
        D = a(84312);
      let P = [
        { href: '/', icon: u.A, i18nKey: 'inicio' },
        { href: '/markets', icon: p.A, i18nKey: 'markets' },
        { href: '/onchain', icon: m.A, i18nKey: 'onchain' },
        { href: '/defi/opportunities', icon: h.A, i18nKey: 'defi' },
        { href: '/equities', icon: g.A, i18nKey: 'equities' },
        { href: '/derivatives', icon: x.A, i18nKey: 'derivatives' },
        { href: '/news', icon: f.A, i18nKey: 'news' },
        { href: '/research', icon: b.A, i18nKey: 'research' },
        { href: '/opx', icon: y.A, i18nKey: 'opx' },
        { href: '/reports', icon: v.A, i18nKey: 'reports' },
        { href: '/dqp', icon: w.A, i18nKey: 'dqp' },
        { href: '/lineage', icon: j.A, i18nKey: 'lineage' },
        { href: '/oracle', icon: k.A, i18nKey: 'oracle' },
        { href: '/academy', icon: N.A, i18nKey: 'academy' },
        { href: '/control', icon: A.A, i18nKey: 'control' },
        { href: '/monitoring', icon: w.A, i18nKey: 'monitoring' },
        { href: 'http://localhost:3005', icon: S.A, i18nKey: 'lava' },
      ];
      function O() {
        let e = (0, o.usePathname)(),
          { sidebarCollapsed: t, toggleSidebar: a } = (0, d.j)(),
          r = (0, n.c3)('nav'),
          u = (0, n.c3)('common');
        return (0, s.jsxs)('nav', {
          className: (0, l.cn)(
            'flex h-screen flex-col border-r border-amber-300/20 bg-black/60 backdrop-blur-2xl text-amber-100/75 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.95)] transition-all duration-300',
            t ? 'w-16' : 'w-64'
          ),
          children: [
            (0, s.jsxs)('div', {
              className:
                'flex h-16 items-center justify-between border-b border-white/10 px-4',
              children: [
                !t &&
                  (0, s.jsxs)('div', {
                    className: 'flex items-center gap-3',
                    children: [
                      (0, s.jsx)('div', {
                        className:
                          'h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/70 via-yellow-400/70 to-amber-300/70 shadow-[0_12px_35px_rgba(250,204,21,0.45)]',
                      }),
                      (0, s.jsxs)('div', {
                        className: 'flex flex-col',
                        children: [
                          (0, s.jsx)('span', {
                            className:
                              'text-xs uppercase tracking-[0.4em] text-amber-200/60',
                            children: u('brand.subtitle'),
                          }),
                          (0, s.jsx)('span', {
                            className: 'text-lg font-semibold text-amber-100',
                            children: u('brand.title'),
                          }),
                        ],
                      }),
                    ],
                  }),
                (0, s.jsx)(c.$, {
                  variant: 'ghost',
                  size: 'sm',
                  onClick: a,
                  className:
                    'h-8 w-8 rounded-full bg-white/5 p-0 text-slate-300/80 hover:bg-white/15 hover:text-white',
                  children: t
                    ? (0, s.jsx)(C.A, { className: 'h-4 w-4' })
                    : (0, s.jsx)(E.A, { className: 'h-4 w-4' }),
                }),
              ],
            }),
            (0, s.jsx)('div', {
              className: 'flex-1 overflow-y-auto py-4',
              children: (0, s.jsx)('div', {
                className: 'space-y-1 px-2',
                children: P.map(a => {
                  let o = a.icon,
                    n = a.href.startsWith('http'),
                    d =
                      !n &&
                      ('/' === a.href
                        ? '/' === e
                        : e === a.href || e.startsWith(a.href + '/')),
                    u = n
                      ? {
                          href: a.href,
                          target: '_blank',
                          rel: 'noopener noreferrer',
                        }
                      : { href: a.href };
                  return (0, s.jsx)(
                    i(),
                    {
                      ...u,
                      children: (0, s.jsxs)(c.$, {
                        variant: 'ghost',
                        size: 'sm',
                        className: (0, l.cn)(
                          'group w-full justify-start rounded-2xl border border-transparent bg-black/40 px-3 py-2 text-sm font-medium text-amber-200/70 transition-all duration-200 hover:border-amber-200/40 hover:bg-amber-500/10 hover:text-amber-100',
                          t ? 'px-2' : 'px-3',
                          d &&
                            'border-amber-300/45 bg-gradient-to-r from-amber-500/30 via-amber-400/25 to-yellow-300/30 text-amber-100 shadow-[0_12px_40px_rgba(250,204,21,0.35)]',
                          n &&
                            'bg-gradient-to-r from-amber-500/20 to-yellow-400/15 text-amber-100 hover:from-amber-500/35 hover:to-yellow-300/20'
                        ),
                        children: [
                          (0, s.jsx)(o, {
                            className: (0, l.cn)(
                              'h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                              t ? '' : 'mr-3'
                            ),
                          }),
                          !t &&
                            (0, s.jsxs)('div', {
                              className: 'flex flex-col items-start',
                              children: [
                                (0, s.jsxs)('div', {
                                  className: 'flex items-center gap-1',
                                  children: [
                                    (0, s.jsx)('span', {
                                      className: 'font-medium tracking-tight',
                                      children: r(
                                        ''.concat(a.i18nKey, '.label')
                                      ),
                                    }),
                                    n &&
                                      (0, s.jsx)(D.A, { className: 'h-3 w-3' }),
                                  ],
                                }),
                                (0, s.jsx)('span', {
                                  className:
                                    'text-xs font-normal text-amber-200/60',
                                  children: r(
                                    ''.concat(a.i18nKey, '.description')
                                  ),
                                }),
                              ],
                            }),
                        ],
                      }),
                    },
                    a.href
                  );
                }),
              }),
            }),
            !t &&
              (0, s.jsx)('div', {
                className: 'border-t p-4',
                children: (0, s.jsxs)('div', {
                  className: 'text-xs text-gray-500',
                  children: [
                    (0, s.jsx)('div', {
                      className: 'font-medium',
                      children: u('footer.product'),
                    }),
                    (0, s.jsx)('div', { children: u('footer.version') }),
                  ],
                }),
              }),
          ],
        });
      }
    },
    61417: (e, t, a) => {
      'use strict';
      a.d(t, { SpotlightProvider: () => V });
      var s = a(51833),
        r = a(59693),
        i = a(70994),
        o = a(12686),
        n = a(33399),
        c = a(83738),
        l = a(72114),
        d = a(80571),
        u = a(28390),
        p = a(37572),
        m = a(27367),
        h = a(34892),
        g = a(85623),
        x = a(34510),
        f = a(31479),
        b = a(88477),
        y = a(72395),
        v = a(95479),
        w = a(64780),
        j = a(61605),
        k = a(76507),
        N = a(75846);
      let A = [
          {
            id: 'goto-home',
            title: 'Dashboard Principal',
            subtitle: 'Dashboard principal con todas las cards',
            icon: l.A,
            category: 'goto',
            keywords: ['inicio', 'dashboard', 'principal', 'home'],
            action: 'navigate',
            payload: '/',
            priority: 100,
          },
          {
            id: 'goto-markets',
            title: 'Mercados',
            subtitle: 'Flujos ETF y datos de funding',
            icon: d.A,
            category: 'goto',
            keywords: ['mercados', 'markets', 'etf', 'funding', 'trading'],
            action: 'navigate',
            payload: '/markets',
            priority: 90,
          },
          {
            id: 'goto-onchain',
            title: 'An\xe1lisis On-Chain',
            subtitle: 'Heatmaps TVL y flujos stablecoin',
            icon: u.A,
            category: 'goto',
            keywords: ['onchain', 'tvl', 'stablecoin', 'defi', 'cadena'],
            action: 'navigate',
            payload: '/onchain',
            priority: 90,
          },
          {
            id: 'goto-defi-yield',
            title: 'DeFi Yield Intelligence',
            subtitle: 'APYs, TVL y oportunidades multichain',
            icon: p.A,
            category: 'goto',
            keywords: [
              'defi',
              'yield',
              'apy',
              'opportunities',
              'gearbox',
              'summerfi',
              'eigenlayer',
              'lido',
            ],
            action: 'navigate',
            payload: '/defi/opportunities',
            priority: 92,
          },
          {
            id: 'goto-derivatives',
            title: 'Derivados',
            subtitle: 'Funding rates y exposici\xf3n gamma',
            icon: m.A,
            category: 'goto',
            keywords: [
              'derivados',
              'derivatives',
              'funding',
              'gamma',
              'opciones',
            ],
            action: 'navigate',
            payload: '/derivatives',
            priority: 90,
          },
          {
            id: 'goto-news',
            title: 'Noticias & Research',
            subtitle: 'Noticias del mercado y actualizaciones regulatorias',
            icon: h.A,
            category: 'goto',
            keywords: [
              'noticias',
              'news',
              'research',
              'regulacion',
              'calendario',
            ],
            action: 'navigate',
            payload: '/news',
            priority: 85,
          },
          {
            id: 'goto-research',
            title: 'Hub de Research',
            subtitle: 'Backtesting y desarrollo de estrategias',
            icon: g.A,
            category: 'goto',
            keywords: ['research', 'backtest', 'estrategia', 'algo'],
            action: 'navigate',
            payload: '/research',
            priority: 95,
          },
          {
            id: 'goto-opx',
            title: 'Oportunidades OP-X',
            subtitle: 'Oportunidades de trading y ejecuci\xf3n',
            icon: x.A,
            category: 'goto',
            keywords: ['opx', 'oportunidades', 'trades', 'ejecucion'],
            action: 'navigate',
            payload: '/opx',
            priority: 95,
          },
          {
            id: 'goto-reports',
            title: 'Reportes',
            subtitle: 'Generar reportes institucionales',
            icon: h.A,
            category: 'goto',
            keywords: [
              'reportes',
              'reports',
              'pdf',
              'institucional',
              'compliance',
            ],
            action: 'navigate',
            payload: '/reports',
            priority: 80,
          },
          {
            id: 'goto-dqp',
            title: 'Calidad de Datos (DQP)',
            subtitle: 'Monitorear pipelines y salud de datos',
            icon: f.A,
            category: 'goto',
            keywords: ['dqp', 'datos', 'calidad', 'pipeline', 'salud'],
            action: 'navigate',
            payload: '/dqp',
            priority: 75,
          },
          {
            id: 'goto-lineage',
            title: 'Linaje de Datos',
            subtitle: 'Rastrear or\xedgenes y transformaciones de datos',
            icon: b.A,
            category: 'goto',
            keywords: ['lineage', 'linaje', 'rastreo', 'datos', 'origenes'],
            action: 'navigate',
            payload: '/lineage',
            priority: 70,
          },
          {
            id: 'goto-academy',
            title: 'Academia',
            subtitle: 'Aprendizaje y certificaci\xf3n',
            icon: y.A,
            category: 'goto',
            keywords: [
              'academia',
              'academy',
              'aprendizaje',
              'educacion',
              'certificacion',
            ],
            action: 'navigate',
            payload: '/academy',
            priority: 60,
          },
          {
            id: 'goto-control',
            title: 'Panel de Control',
            subtitle: 'Configuraci\xf3n del sistema y administraci\xf3n',
            icon: v.A,
            category: 'goto',
            keywords: ['control', 'configuracion', 'admin', 'ajustes'],
            action: 'navigate',
            payload: '/control',
            priority: 50,
          },
        ],
        S = [
          {
            id: 'run-worker',
            title: 'Ejecutar Worker',
            subtitle: 'Ejecutar procesamiento de datos en segundo plano',
            icon: w.A,
            category: 'run',
            keywords: ['ejecutar', 'worker', 'procesar', 'segundo plano'],
            action: 'run-worker',
            priority: 90,
          },
          {
            id: 'generate-onepager',
            title: 'Generar Reporte One-Pager',
            subtitle: 'Crear reporte resumen institucional',
            icon: h.A,
            category: 'run',
            keywords: ['generar', 'reporte', 'onepager', 'pdf'],
            action: 'generate-report',
            payload: 'onepager',
            priority: 85,
          },
          {
            id: 'new-backtest',
            title: 'Nuevo Backtest',
            subtitle: 'Iniciar nuevo backtest de research',
            icon: j.A,
            category: 'run',
            keywords: ['nuevo', 'backtest', 'research', 'estrategia'],
            action: 'new-backtest',
            priority: 80,
          },
          {
            id: 'run-all-alerts',
            title: 'Run All Alert Checks',
            subtitle: 'Execute all monitoring alerts',
            icon: k.A,
            category: 'run',
            keywords: ['alerts', 'run', 'check', 'monitor'],
            action: 'run-alerts',
            priority: 70,
          },
        ],
        C = [
          {
            id: 'docs-shortcuts',
            title: 'Keyboard Shortcuts',
            subtitle: 'View all available hotkeys',
            icon: N.A,
            category: 'docs',
            keywords: ['shortcuts', 'hotkeys', 'keyboard'],
            action: 'show-shortcuts',
            priority: 70,
          },
          {
            id: 'docs-api',
            title: 'API Documentation',
            subtitle: 'Explore available API endpoints',
            icon: f.A,
            category: 'docs',
            keywords: ['api', 'documentation', 'endpoints'],
            action: 'open-url',
            payload: '/api-docs',
            priority: 60,
          },
        ];
      async function E(e) {
        let t =
            arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 5,
          a = [];
        try {
          let s = await fetch(
            '/api/read/alerts?q='
              .concat(encodeURIComponent(e), '&limit=')
              .concat(t)
          );
          s.ok &&
            (await s.json()).slice(0, 2).forEach(e => {
              a.push({
                id: 'alert-'.concat(e.id),
                title: 'Alert: '.concat(e.title),
                subtitle: ''.concat(e.severity, ' - ').concat(e.status),
                icon: k.A,
                category: 'entities',
                keywords: [e.title, e.severity, 'alert'],
                action: 'view-alert',
                payload: e.id,
                asOf: e.timestamp,
                priority: 60,
              });
            });
          let r = await fetch(
            '/api/read/reports?q='
              .concat(encodeURIComponent(e), '&limit=')
              .concat(t)
          );
          r.ok &&
            (await r.json()).slice(0, 2).forEach(e => {
              a.push({
                id: 'report-'.concat(e.id),
                title: 'Report: '.concat(e.title),
                subtitle: ''.concat(e.type, ' - ').concat(e.status),
                icon: h.A,
                category: 'entities',
                keywords: [e.title, e.type, 'report'],
                action: 'view-report',
                payload: e.id,
                asOf: e.createdAt,
                priority: 55,
              });
            });
          let i = await fetch(
            '/api/read/opx/opportunities?q='
              .concat(encodeURIComponent(e), '&limit=')
              .concat(t)
          );
          i.ok &&
            (await i.json()).slice(0, 1).forEach(e => {
              a.push({
                id: 'opx-'.concat(e.id),
                title: 'Opportunity: '.concat(e.title),
                subtitle: 'Score: '.concat(e.score, ' - ').concat(e.status),
                icon: x.A,
                category: 'entities',
                keywords: [e.title, 'opportunity', 'trade'],
                action: 'view-opportunity',
                payload: e.id,
                asOf: e.timestamp,
                priority: 65,
              });
            });
        } catch (e) {
          console.warn('Entity search failed:', e);
        }
        return a;
      }
      function D(e, t) {
        if (!e) return 1;
        let a = e.toLowerCase(),
          s = t.toLowerCase();
        if (s.includes(a)) return 0 === s.indexOf(a) ? 1 : 0.8;
        let r = 0,
          i = 0,
          o = 0;
        for (; r < a.length && i < s.length; )
          (a[r] === s[i] && (o++, r++), i++);
        let n = o / a.length;
        return n >= 0.6 ? 0.6 * n : 0;
      }
      var P = a(27609);
      let O = 'adaf-spotlight-recent';
      var T = a(49920),
        R = a(2056),
        I = a(82952),
        L = a(74122),
        z = a(38964),
        F = a(10363),
        K = a(81429);
      let q = {
        goto: { label: 'Ir A', color: 'bg-blue-100 text-blue-800' },
        run: { label: 'Ejecutar', color: 'bg-green-100 text-green-800' },
        entities: {
          label: 'Entidades',
          color: 'bg-purple-100 text-purple-800',
        },
        docs: { label: 'Docs', color: 'bg-orange-100 text-orange-800' },
        hashes: { label: 'Hash', color: 'bg-gray-100 text-gray-800' },
      };
      function _(e) {
        let { command: t, isSelected: a, onClick: r } = e,
          i = q[t.category],
          o = t.icon;
        return (0, s.jsxs)('div', {
          className: (0, K.cn)(
            'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
            'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
            a && 'bg-blue-50 border border-blue-200'
          ),
          onClick: r,
          role: 'option',
          'aria-selected': a,
          tabIndex: -1,
          children: [
            (0, s.jsx)('div', {
              className: (0, K.cn)(
                'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
                'bg-gray-100 text-gray-600'
              ),
              children: (0, s.jsx)(o, { className: 'h-4 w-4' }),
            }),
            (0, s.jsxs)('div', {
              className: 'flex-1 min-w-0',
              children: [
                (0, s.jsxs)('div', {
                  className: 'flex items-center gap-2 mb-1',
                  children: [
                    (0, s.jsx)('h3', {
                      className: 'text-sm font-medium text-gray-900 truncate',
                      children: t.title,
                    }),
                    (0, s.jsx)(n.E, {
                      variant: 'secondary',
                      className: (0, K.cn)('text-xs', i.color),
                      children: i.label,
                    }),
                  ],
                }),
                t.subtitle &&
                  (0, s.jsx)('p', {
                    className: 'text-xs text-gray-500 truncate',
                    children: t.subtitle,
                  }),
                t.asOf &&
                  (0, s.jsxs)('div', {
                    className: 'flex items-center gap-1 mt-1',
                    children: [
                      (0, s.jsx)(R.A, { className: 'h-3 w-3 text-gray-400' }),
                      (0, s.jsx)('span', {
                        className: 'text-xs text-gray-400',
                        children: (0, T.m)(new Date(t.asOf), { addSuffix: !0 }),
                      }),
                    ],
                  }),
              ],
            }),
            (0, s.jsx)('div', {
              className: 'flex-shrink-0',
              children:
                a && (0, s.jsx)(I.A, { className: 'h-4 w-4 text-blue-600' }),
            }),
          ],
        });
      }
      function M(e) {
        let { className: t } = e,
          {
            isOpen: a,
            query: n,
            selectedIndex: l,
            isLoading: d,
            commands: u,
            closeSpotlight: p,
            setQuery: m,
            executeCommand: h,
          } = (function (e) {
            let t = (0, c.useRouter)(),
              [a, s] = (0, r.useState)(!1),
              [i, o] = (0, r.useState)(''),
              [n, l] = (0, r.useState)(0),
              [d, u] = (0, r.useState)(!1),
              [p, m] = (0, r.useState)([]),
              [h, g] = (0, r.useState)([]);
            (0, r.useEffect)(() => {
              try {
                let e = localStorage.getItem(O);
                e && g(JSON.parse(e));
              } catch (e) {}
            }, []);
            let x = (0, r.useCallback)(e => {
                g(t => {
                  let a = [e, ...t.filter(t => t !== e)].slice(0, 5);
                  try {
                    localStorage.setItem(O, JSON.stringify(a));
                  } catch (e) {}
                  return a;
                });
              }, []),
              f = (0, r.useCallback)(() => {
                (s(!0), o(''), l(0), m([]), (0, P.dB)('Spotlight', 'Open'));
              }, []),
              y = (0, r.useCallback)(() => {
                (s(!1), o(''), l(0), m([]));
              }, [void 0]);
            (0, r.useEffect)(() => {
              if (!i.trim()) return void m([]);
              let e = setTimeout(async () => {
                u(!0);
                try {
                  let e = await E(i.trim());
                  m(e);
                } catch (e) {
                  (console.warn('Entity search failed:', e), m([]));
                } finally {
                  u(!1);
                }
              }, 300);
              return () => clearTimeout(e);
            }, [i]);
            let v = (0, r.useMemo)(() => {
                let e = i.trim()
                  ? [
                      ...A,
                      ...S,
                      ...C,
                      ...(function (e) {
                        if (!/^[a-f0-9]{6,}$/i.test(e.trim())) return [];
                        let t = e.trim();
                        return [
                          {
                            id: 'hash-lineage-'.concat(t),
                            title: 'View Lineage for '.concat(t),
                            subtitle: 'Open data lineage trace',
                            icon: b.A,
                            category: 'hashes',
                            keywords: ['lineage', 'hash', 'trace'],
                            action: 'view-lineage',
                            payload: t,
                            priority: 80,
                          },
                          {
                            id: 'hash-alert-'.concat(t),
                            title: 'View Alert '.concat(t),
                            subtitle: 'Open alert details',
                            icon: k.A,
                            category: 'hashes',
                            keywords: ['alert', 'hash'],
                            action: 'view-alert',
                            payload: t,
                            priority: 75,
                          },
                        ];
                      })(i),
                    ]
                      .map(e => {
                        let t = D(i, e.title),
                          a = Math.max(
                            t,
                            Math.max(...e.keywords.map(e => D(i, e))),
                            e.subtitle ? D(i, e.subtitle) : 0
                          ),
                          s = (e.priority || 50) / 100;
                        return { ...e, score: 0.7 * a + 0.3 * s };
                      })
                      .filter(e => e.score > 0.2)
                      .sort((e, t) => t.score - e.score)
                      .slice(0, 10)
                  : [...A.slice(0, 6), ...S.slice(0, 3)];
                return i.trim()
                  ? [...e, ...p]
                      .sort((e, t) => {
                        let a =
                          ('score' in e ? e.score : void 0) ||
                          (e.priority || 50) / 100;
                        return (
                          (('score' in t ? t.score : void 0) ||
                            (t.priority || 50) / 100) - a
                        );
                      })
                      .slice(0, 10)
                  : [
                      ...e
                        .filter(e => h.includes(e.id))
                        .sort((e, t) => h.indexOf(e.id) - h.indexOf(t.id)),
                      ...e.filter(e => !h.includes(e.id)),
                    ];
              }, [i, p, h]),
              w = (0, r.useCallback)(
                async e => {
                  ((0, P.dB)('Spotlight', 'Execute', {
                    cmdId: e.id,
                    action: e.action,
                  }),
                    x(e.id),
                    y());
                  try {
                    switch (e.action) {
                      case 'navigate':
                        t.push(e.payload);
                        break;
                      case 'run-worker':
                        window.confirm(
                          'Run background worker once? This may affect system performance briefly.'
                        ) &&
                          (await fetch('/api/ops/worker/run', {
                            method: 'POST',
                          }));
                        break;
                      case 'generate-report': {
                        let t = e.payload;
                        await fetch('/api/generate/report/'.concat(t), {
                          method: 'POST',
                        });
                        break;
                      }
                      case 'new-backtest':
                        t.push('/research?new=true');
                        break;
                      case 'run-alerts':
                        await fetch('/api/ops/alerts/run-all', {
                          method: 'POST',
                        });
                        break;
                      case 'show-shortcuts':
                        window.dispatchEvent(
                          new CustomEvent('help:show', { detail: 'shortcuts' })
                        );
                        break;
                      case 'open-url':
                        e.payload &&
                          (e.url
                            ? window.open(e.url, '_blank')
                            : t.push(e.payload));
                        break;
                      case 'view-alert':
                        t.push('/alerts/'.concat(e.payload));
                        break;
                      case 'view-report':
                        t.push('/reports/'.concat(e.payload));
                        break;
                      case 'view-opportunity':
                        t.push('/opx/'.concat(e.payload));
                        break;
                      case 'view-lineage':
                        t.push('/lineage?hash='.concat(e.payload));
                        break;
                      default:
                        console.warn('Unknown command action:', e.action);
                    }
                  } catch (e) {
                    console.error('Failed to execute command:', e);
                  }
                },
                [t, x, y]
              ),
              j = (0, r.useCallback)(
                e => {
                  if (a)
                    switch (e.key) {
                      case 'Escape':
                        (e.preventDefault(), y());
                        break;
                      case 'ArrowDown':
                        (e.preventDefault(),
                          l(e => (e < v.length - 1 ? e + 1 : e)));
                        break;
                      case 'ArrowUp':
                        (e.preventDefault(), l(e => (e > 0 ? e - 1 : e)));
                        break;
                      case 'Enter':
                        (e.preventDefault(), v[n] && w(v[n]));
                        break;
                      case 'Tab':
                        (e.preventDefault(),
                          l(e => (e < v.length - 1 ? e + 1 : 0)));
                    }
                },
                [a, v, n, w, y]
              );
            return (
              (0, r.useEffect)(() => {
                let e = () => f();
                return (
                  window.addEventListener('spotlight:open', e),
                  document.addEventListener('keydown', j),
                  () => {
                    (window.removeEventListener('spotlight:open', e),
                      document.removeEventListener('keydown', j));
                  }
                );
              }, [f, j]),
              (0, r.useEffect)(() => {
                l(0);
              }, [v]),
              {
                isOpen: a,
                query: i,
                selectedIndex: n,
                isLoading: d,
                commands: v,
                openSpotlight: f,
                closeSpotlight: y,
                setQuery: o,
                setSelectedIndex: l,
                executeCommand: w,
              }
            );
          })(),
          g = u.reduce((e, t, a) => {
            let s = t.category;
            return (
              e[s] || (e[s] = []),
              e[s].push({ ...t, originalIndex: a }),
              e
            );
          }, {}),
          x = ['goto', 'run', 'entities', 'docs', 'hashes'].filter(e => {
            var t;
            return (null == (t = g[e]) ? void 0 : t.length) > 0;
          });
        return (0, s.jsx)(i.lG, {
          open: a,
          onOpenChange: p,
          children: (0, s.jsxs)(i.Cf, {
            className: (0, K.cn)(
              'max-w-2xl p-0 gap-0 overflow-hidden',
              'focus:outline-none',
              t
            ),
            role: 'dialog',
            'aria-label': 'Spotlight Search',
            'aria-modal': 'true',
            children: [
              (0, s.jsx)('div', {
                className: 'border-b border-gray-200 p-4',
                children: (0, s.jsxs)('div', {
                  className: 'relative',
                  children: [
                    (0, s.jsx)(L.A, {
                      className:
                        'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400',
                    }),
                    (0, s.jsx)(o.p, {
                      placeholder:
                        'Buscar comandos, ir a p\xe1ginas, ejecutar acciones...',
                      value: n,
                      onChange: e => m(e.target.value),
                      className: 'pl-10 pr-10 border-0 focus:ring-0 text-base',
                      autoFocus: !0,
                      role: 'combobox',
                      'aria-label': 'Buscar comandos',
                      'aria-autocomplete': 'list',
                      'aria-expanded': u.length > 0,
                      'aria-controls': 'spotlight-results',
                    }),
                    d &&
                      (0, s.jsx)(z.A, {
                        className:
                          'absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400',
                      }),
                  ],
                }),
              }),
              (0, s.jsx)('div', {
                className: 'max-h-96 overflow-y-auto p-2',
                id: 'spotlight-results',
                role: 'listbox',
                'aria-label': 'Resultados de b\xfasqueda',
                children:
                  0 === u.length
                    ? (0, s.jsx)('div', {
                        className: 'text-center py-8 text-gray-500',
                        children: n.trim()
                          ? 'No se encontraron resultados'
                          : 'Empieza a escribir para buscar...',
                      })
                    : (0, s.jsx)('div', {
                        className: 'space-y-1',
                        children: x.map(e =>
                          (0, s.jsxs)(
                            r.Fragment,
                            {
                              children: [
                                x.length > 1 &&
                                  (0, s.jsx)('div', {
                                    className:
                                      'px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider',
                                    children: q[e].label,
                                  }),
                                g[e].map(e =>
                                  (0, s.jsx)(
                                    _,
                                    {
                                      command: e,
                                      isSelected: l === e.originalIndex,
                                      onClick: () => h(e),
                                    },
                                    e.id
                                  )
                                ),
                              ],
                            },
                            e
                          )
                        ),
                      }),
              }),
              (0, s.jsx)('div', {
                className:
                  'border-t border-gray-200 px-4 py-3 text-xs text-gray-500',
                children: (0, s.jsxs)('div', {
                  className: 'flex items-center justify-between',
                  children: [
                    (0, s.jsxs)('div', {
                      className: 'flex items-center gap-4',
                      children: [
                        (0, s.jsxs)('div', {
                          className: 'flex items-center gap-1',
                          children: [
                            (0, s.jsx)('kbd', {
                              className:
                                'px-1.5 py-0.5 bg-gray-100 rounded border text-xs',
                              children: '↑',
                            }),
                            (0, s.jsx)('kbd', {
                              className:
                                'px-1.5 py-0.5 bg-gray-100 rounded border text-xs',
                              children: '↓',
                            }),
                            (0, s.jsx)('span', { children: 'navigate' }),
                          ],
                        }),
                        (0, s.jsxs)('div', {
                          className: 'flex items-center gap-1',
                          children: [
                            (0, s.jsx)('kbd', {
                              className:
                                'px-1.5 py-0.5 bg-gray-100 rounded border text-xs',
                              children: 'Enter',
                            }),
                            (0, s.jsx)('span', { children: 'select' }),
                          ],
                        }),
                        (0, s.jsxs)('div', {
                          className: 'flex items-center gap-1',
                          children: [
                            (0, s.jsx)('kbd', {
                              className:
                                'px-1.5 py-0.5 bg-gray-100 rounded border text-xs',
                              children: 'Esc',
                            }),
                            (0, s.jsx)('span', { children: 'close' }),
                          ],
                        }),
                      ],
                    }),
                    (0, s.jsxs)('div', {
                      className: 'flex items-center gap-1 text-gray-400',
                      children: [
                        (0, s.jsx)(F.A, { className: 'h-3 w-3' }),
                        (0, s.jsx)('span', { children: 'Spotlight' }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
        });
      }
      function V(e) {
        let { children: t } = e;
        return (0, s.jsxs)(s.Fragment, { children: [t, (0, s.jsx)(M, {})] });
      }
    },
    68570: (e, t, a) => {
      (Promise.resolve().then(a.t.bind(a, 26511, 23)),
        Promise.resolve().then(a.bind(a, 55582)),
        Promise.resolve().then(a.bind(a, 32426)),
        Promise.resolve().then(a.bind(a, 97011)),
        Promise.resolve().then(a.bind(a, 98574)),
        Promise.resolve().then(a.bind(a, 46272)),
        Promise.resolve().then(a.bind(a, 96514)),
        Promise.resolve().then(a.bind(a, 61417)));
    },
    70994: (e, t, a) => {
      'use strict';
      a.d(t, {
        Cf: () => u,
        Es: () => m,
        L3: () => h,
        c7: () => p,
        lG: () => n,
        rr: () => g,
        zM: () => c,
      });
      var s = a(51833);
      a(59693);
      var r = a(87676),
        i = a(66846),
        o = a(81429);
      function n(e) {
        let { ...t } = e;
        return (0, s.jsx)(r.bL, { 'data-slot': 'dialog', ...t });
      }
      function c(e) {
        let { ...t } = e;
        return (0, s.jsx)(r.l9, { 'data-slot': 'dialog-trigger', ...t });
      }
      function l(e) {
        let { ...t } = e;
        return (0, s.jsx)(r.ZL, { 'data-slot': 'dialog-portal', ...t });
      }
      function d(e) {
        let { className: t, ...a } = e;
        return (0, s.jsx)(r.hJ, {
          'data-slot': 'dialog-overlay',
          className: (0, o.cn)(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
            t
          ),
          ...a,
        });
      }
      function u(e) {
        let { className: t, children: a, showCloseButton: n = !0, ...c } = e;
        return (0, s.jsxs)(l, {
          'data-slot': 'dialog-portal',
          children: [
            (0, s.jsx)(d, {}),
            (0, s.jsxs)(r.UC, {
              'data-slot': 'dialog-content',
              className: (0, o.cn)(
                'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
                t
              ),
              ...c,
              children: [
                a,
                n &&
                  (0, s.jsxs)(r.bm, {
                    'data-slot': 'dialog-close',
                    className:
                      "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                    children: [
                      (0, s.jsx)(i.A, {}),
                      (0, s.jsx)('span', {
                        className: 'sr-only',
                        children: 'Close',
                      }),
                    ],
                  }),
              ],
            }),
          ],
        });
      }
      function p(e) {
        let { className: t, ...a } = e;
        return (0, s.jsx)('div', {
          'data-slot': 'dialog-header',
          className: (0, o.cn)(
            'flex flex-col gap-2 text-center sm:text-left',
            t
          ),
          ...a,
        });
      }
      function m(e) {
        let { className: t, ...a } = e;
        return (0, s.jsx)('div', {
          'data-slot': 'dialog-footer',
          className: (0, o.cn)(
            'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
            t
          ),
          ...a,
        });
      }
      function h(e) {
        let { className: t, ...a } = e;
        return (0, s.jsx)(r.hE, {
          'data-slot': 'dialog-title',
          className: (0, o.cn)('text-lg leading-none font-semibold', t),
          ...a,
        });
      }
      function g(e) {
        let { className: t, ...a } = e;
        return (0, s.jsx)(r.VY, {
          'data-slot': 'dialog-description',
          className: (0, o.cn)('text-muted-foreground text-sm', t),
          ...a,
        });
      }
    },
    96514: (e, t, a) => {
      'use strict';
      a.d(t, { default: () => c });
      var s = a(51833),
        r = a(80175),
        i = a(74784),
        o = a(94308),
        n = a(59693);
      function c(e) {
        let { children: t } = e,
          [a] = (0, n.useState)(
            () =>
              new r.E({
                defaultOptions: {
                  queries: {
                    staleTime: 6e4,
                    gcTime: 6e5,
                    retry: (e, t) => {
                      if (t && 'object' == typeof t && 'status' in t) {
                        let e = t.status;
                        if (e >= 400 && e < 500) return !1;
                      }
                      return e < 3;
                    },
                    refetchOnWindowFocus: !1,
                  },
                  mutations: { retry: !1 },
                },
              })
          );
        return (0, s.jsxs)(i.Ht, {
          client: a,
          children: [t, (0, s.jsx)(o.E, { initialIsOpen: !1 })],
        });
      }
    },
    97011: (e, t, a) => {
      'use strict';
      a.d(t, { PageGuide: () => m });
      var s = a(51833),
        r = a(50824),
        i = a.n(r),
        o = a(59693),
        n = a(83738),
        c = a(81429),
        l = a(30249),
        d = a.n(l);
      function u(e) {
        let { children: t, delay: a = 0, className: r } = e;
        return (0, s.jsx)('div', {
          className: (0, c.cn)('overflow-hidden', r),
          children: (0, s.jsx)('div', {
            className: 'quick-help-animate',
            style: { animationDelay: ''.concat(a, 'ms') },
            children: t,
          }),
        });
      }
      let p = [
        {
          prefix: '/monitoring',
          guide: {
            title: 'Monitoring',
            what: 'Salud del sistema, checks profundos y diagn\xf3stico operativo.',
            objective: 'Detectar problemas en minutos y seguir el runbook.',
            steps: [
              'Ejecuta health deep (DB/Redis/externos)',
              'Revisa errores y latencias',
              'Sigue el runbook seg\xfan el tipo de alerta',
            ],
            concepts: [
              'Liveness/Readiness',
              'Latency p95',
              'Errores 5xx',
              'SLO',
            ],
            success:
              'Identificaste la causa y accionaste (escalado/reintento/runbook).',
            cta: { label: 'Aprende m\xe1s (Ops)', href: '/academy?topic=ops' },
          },
        },
        {
          prefix: '/dashboard',
          guide: {
            title: 'Panel principal',
            what: 'Vista general: salud, se\xf1ales clave y accesos r\xe1pidos a m\xf3dulos.',
            objective:
              'En 60s, entender el estado y decidir la siguiente acci\xf3n.',
            steps: [
              'Revisa KPIs y estado de salud',
              'Explora tarjetas: alertas, TVL, DQP, guardrails',
              'Si hay anomal\xedas, abre Monitoring o Research',
            ],
            concepts: [
              'KPI',
              'Se\xf1ales/Alertas',
              'Guardrails',
              'Salud del sistema',
            ],
            success:
              'Puedes explicar el estado y abrir el panel correcto para profundizar.',
            tags: ['overview', 'kpi', 'acciones'],
            cta: {
              label: 'Aprende m\xe1s (Overview)',
              href: '/academy?topic=overview',
            },
          },
        },
        {
          prefix: '/opx',
          guide: {
            title: 'Guardrails & Ops (OpX)',
            what: 'Reglas operativas, bloqueos y eventos autom\xe1ticos.',
            objective:
              'Entender por qu\xe9 se bloque\xf3 algo y c\xf3mo actuar.',
            steps: [
              'Identifica la regla activada',
              'Revisa contexto y cooldown',
              'Levanta bloqueo o ajusta par\xe1metros si procede',
            ],
            concepts: ['Cooldown', 'Regla', 'Severidad', 'Evento'],
            success: 'Desbloqueo/ajuste documentado y en control.',
            cta: { label: 'Aprende m\xe1s (OpX)', href: '/academy?topic=opx' },
          },
        },
        {
          prefix: '/research',
          guide: {
            title: 'Research',
            what: 'Herramientas para analizar estrategias, se\xf1ales y comparativas.',
            objective: 'Comparar estrategias y entender su desempe\xf1o.',
            steps: [
              'Elige una estrategia o preset',
              'Compara curvas de equity y m\xe9tricas',
              'Identifica diferencias y decisiones a tomar',
            ],
            concepts: ['Backtest', 'Equity curve', 'Presets', 'Comparativa'],
            success:
              'Comparaste 2+ estrategias y decidiste cu\xe1l profundizar.',
            cta: {
              label: 'Aprende m\xe1s (Research)',
              href: '/academy?topic=research',
            },
          },
        },
        {
          prefix: '/etf-flows',
          guide: {
            title: 'ETF Flows',
            what: 'Flujos de entrada/salida en ETFs (BTC/ETH) y su impacto.',
            objective:
              'Detectar cambios de r\xe9gimen por flujos y su efecto en precio.',
            steps: [
              'Observa inflows/outflows por ventana (1d/5d/MTD)',
              'Relaciona con WSPS/sem\xe1foro y eventos',
              'Toma nota de sesgos para el plan de trading',
            ],
            concepts: ['Inflow/Outflow', 'MTD/5D', 'WSPS', 'Sesgo direccional'],
            success: 'Resumes si flujos refuerzan o contradicen el sesgo.',
            cta: {
              label: 'Aprende m\xe1s (ETF Flows)',
              href: '/academy?topic=etf',
            },
          },
        },
        {
          prefix: '/derivatives',
          guide: {
            title: 'Derivados',
            what: 'Panel de opciones, gamma y m\xe9tricas de derivados.',
            objective: 'Evaluar presi\xf3n gamma y riesgos de reversi\xf3n.',
            steps: [
              'Revisa gamma exposure y strikes clave',
              'Busca zonas de pin/riesgo',
              'Ajusta expectativas de volatilidad',
            ],
            concepts: ['Gamma', 'Pin risk', 'Volatilidad', 'Strikes'],
            success:
              'Identificaste zonas probables de atracci\xf3n/repulsi\xf3n de precio.',
            cta: {
              label: 'Aprende m\xe1s (Derivados)',
              href: '/academy?topic=derivatives',
            },
          },
        },
        {
          prefix: '/markets',
          guide: {
            title: 'Mercados',
            what: 'Estado de mercado: \xedndices, FX, rates y correlaciones.',
            objective: 'Entender el contexto macro que afecta cripto.',
            steps: [
              'Mira DXY, yields y VIX',
              'Correlaci\xf3n con BTC/ETH',
              'Anota riesgos macro inmediatos',
            ],
            concepts: ['DXY', 'Yields', 'VIX', 'Correlaci\xf3n'],
            success: 'Puedes explicar el viento macro a favor/en contra.',
            cta: {
              label: 'Aprende m\xe1s (Macro)',
              href: '/academy?topic=macro',
            },
          },
        },
        {
          prefix: '/news',
          guide: {
            title: 'Noticias',
            what: 'Stream de noticias deduplicadas y relevantes.',
            objective: 'Detectar noticias catalizadoras y su impacto.',
            steps: [
              'Escanea titulares y severidad',
              'Abre las de severidad alta',
              'Relaciona con flujos y derivados',
            ],
            concepts: ['Catalizador', 'Severidad', 'Deduplicaci\xf3n'],
            success: 'Identificaste 1-2 noticias que justifican acciones.',
            cta: {
              label: 'Aprende m\xe1s (Noticias)',
              href: '/academy?topic=news',
            },
          },
        },
        {
          prefix: '/onchain',
          guide: {
            title: 'On-chain / TVL',
            what: 'Datos on-chain y TVL por protocolo/cadena.',
            objective: 'Ver rotaci\xf3n de liquidez y riesgos concentrados.',
            steps: [
              'Observa TVL cambios 24h/MTD',
              'Detecta salidas fuertes por protocolo',
              'Cruza con eventos y derivados',
            ],
            concepts: ['TVL', 'Rotaci\xf3n', 'Riesgo protocolo'],
            success: 'Puedes se\xf1alar protocolos en alerta o oportunidad.',
            cta: {
              label: 'Aprende m\xe1s (On-chain)',
              href: '/academy?topic=onchain',
            },
          },
        },
        {
          prefix: '/defi/opportunities',
          guide: {
            title: 'DeFi Yield Intelligence',
            what: 'Mapa en tiempo real de rendimientos, TVL y riesgos en protocolos DeFi clave.',
            objective:
              'Detectar rendimientos sostenibles y rotaciones de liquidez para actuar antes que el mercado.',
            steps: [
              'Filtra por chain, protocolo o stablecoins seg\xfan tu tesis',
              'Ordena por APY y revisa la composici\xf3n base vs. rewards',
              'Cruza TVL y cambios de APY para validar sostenibilidad',
            ],
            concepts: ['APY', 'TVL', 'Risk score', 'Stablecoins', 'Restaking'],
            success:
              'Identificaste 1-2 oportunidades con APY atractivo, TVL saludable y riesgo alineado al mandato.',
            tags: ['defi', 'yield', 'real-yield'],
            cta: { label: 'Ver research DeFi', href: '/research?topic=defi' },
          },
        },
        {
          prefix: '/equities',
          guide: {
            title: 'Equities AI Sleeve',
            what: 'Motor multi-factor con recomendaciones accionables, flujos ETF y control institucional.',
            objective:
              'Seleccionar el plan de rebalance con base en se\xf1ales cuantitativas y riesgo controlado.',
            steps: [
              'Revisa el snapshot del sleeve y los l\xedmites de riesgo',
              'Eval\xfaa se\xf1ales, fundamentales, flujos ETF y ownership para validar tesis',
              'Ejecuta un backtest r\xe1pido y documenta la decisi\xf3n en Control',
            ],
            concepts: [
              'Multi-factor',
              'ETF flows',
              'Institutional ownership',
              'Backtest',
            ],
            success:
              'Generaste un paquete validado con plan de ejecuci\xf3n y evidencia cuantitativa.',
            cta: {
              label: 'Profundizar en Research',
              href: '/research?topic=equities',
            },
          },
        },
        {
          prefix: '/wallstreet',
          guide: {
            title: 'Wall Street Pulse (WSP)',
            what: 'Score WSPS, eventos y auto-react.',
            objective: 'Usar WSPS como br\xfajula de sesgo institucional.',
            steps: [
              'Consulta WSPS actual y su tendencia',
              'Mira eventos generados y cooldowns',
              'Decide si refuerza/contradice tu plan',
            ],
            concepts: ['WSPS', 'Eventos', 'Cooldown'],
            success: 'Puedes justificar tu sesgo usando WSPS y eventos.',
            cta: { label: 'Aprende m\xe1s (WSP)', href: '/academy?topic=wsp' },
          },
        },
        {
          prefix: '/security',
          guide: {
            title: 'Seguridad',
            what: 'Panel de CSP, claves y controles.',
            objective: 'Verificar postura de seguridad y acciones inmediatas.',
            steps: [
              'Revisa advertencias CSP',
              'Valida rotaci\xf3n de claves',
              'Prueba alertas webhooks si procede',
            ],
            concepts: ['CSP', 'Rotaci\xf3n', 'Webhooks'],
            success: 'Checklist b\xe1sico de seguridad en verde.',
            cta: {
              label: 'Aprende m\xe1s (Seguridad)',
              href: '/academy?topic=security',
            },
          },
        },
        {
          prefix: '/reports',
          guide: {
            title: 'Reportes (M\xf3dulo F)',
            what: 'KPIs institucionales y generaci\xf3n de PDFs.',
            objective: 'Preparar un paquete de reporte para revisi\xf3n.',
            steps: [
              'Selecciona periodo y KPIs',
              'Genera el borrador PDF',
              'Valida cifras y distribuye',
            ],
            concepts: ['IRR', 'TVPI', 'NAV', 'Proof of Reserves'],
            success: 'Reporte generado y validado sin discrepancias.',
            cta: {
              label: 'Aprende m\xe1s (M\xf3dulo F)',
              href: '/academy?topic=module-f',
            },
          },
        },
        {
          prefix: '/academy',
          guide: {
            title: 'Academy',
            what: 'Lecciones, quizzes y seguimiento de progreso.',
            objective: 'Aprender conceptos y validar comprensi\xf3n.',
            steps: [
              'Abre una lecci\xf3n',
              'Completa el quiz',
              'Revisa tu progreso y repite si es necesario',
            ],
            concepts: ['Lecci\xf3n', 'Quiz', 'Progreso'],
            success: 'Completaste una unidad y entendiste los conceptos.',
            cta: { label: 'Ir a Academy', href: '/academy' },
          },
        },
        {
          prefix: '/dqp',
          guide: {
            title: 'Data Quality (DQP)',
            what: 'Estado de frescura y calidad de datos.',
            objective: 'Asegurar datos actualizados para decisiones.',
            steps: [
              'Revisa freshness y atrasos',
              'Identifica fuentes problem\xe1ticas',
              'Escala o reingesta seg\xfan runbook',
            ],
            concepts: ['Freshness', 'Lag', 'Reproceso'],
            success: 'Todos los feeds cr\xedticos dentro de SLO.',
            cta: { label: 'Abrir Monitoring', href: '/monitoring' },
          },
        },
        {
          prefix: '/pnl',
          guide: {
            title: 'PnL Analytics',
            what: 'Rendimiento por periodo y an\xe1lisis de curvas.',
            objective: 'Entender drivers de rendimiento y drawdowns.',
            steps: [
              'Selecciona rango',
              'Observa drawdowns y recuperaci\xf3n',
              'Relaciona con eventos/estrategias',
            ],
            concepts: ['PnL', 'Drawdown', 'Recuperaci\xf3n'],
            success: 'Puedes explicar el PnL reciente y sus causas.',
            cta: { label: 'Aprende m\xe1s (PnL)', href: '/academy?topic=pnl' },
          },
        },
      ];
      function m(e) {
        let { className: t } = e,
          a = (0, n.usePathname)(),
          r = (function (e) {
            let t = p.find(t => e.startsWith(t.prefix));
            return t ? t.guide : null;
          })(a || '/'),
          [l, m] = o.useState(!0),
          [h, g] = o.useState(!0),
          x = o.useMemo(() => 'pageguide:'.concat(a), [a]);
        return (o.useEffect(() => {
          let e = window.localStorage.getItem('pageguide:always');
          null === e
            ? (window.localStorage.setItem('pageguide:always', '1'), g(!0))
            : g('0' !== e);
          let t = window.localStorage.getItem(x);
          null === e || '0' === e
            ? ('open' === t && m(!0), 'closed' === t && m(!1))
            : m(!0);
        }, [x]),
        o.useEffect(() => {
          h || window.localStorage.setItem(x, l ? 'open' : 'closed');
        }, [l, x, h]),
        o.useEffect(() => {
          let e = () => {
            try {
              let e = window.localStorage.getItem('pageguide:always'),
                t = null === e || ('0' !== e && 'false' !== e);
              (g(t), m(!!t || l));
            } catch (e) {}
          };
          return (
            window.addEventListener('pageguide:always-changed', e),
            () => window.removeEventListener('pageguide:always-changed', e)
          );
        }, [l]),
        r)
          ? (0, s.jsxs)(s.Fragment, {
              children: [
                (0, s.jsxs)('div', {
                  className:
                    'jsx-9553843d1a114593 ' +
                    ((0, c.cn)(
                      'mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900',
                      t
                    ) || ''),
                  children: [
                    (0, s.jsxs)('div', {
                      className:
                        'jsx-9553843d1a114593 flex items-center justify-between gap-3',
                      children: [
                        (0, s.jsxs)('div', {
                          className:
                            'jsx-9553843d1a114593 flex items-center gap-2',
                          children: [
                            (0, s.jsx)('span', {
                              className:
                                'jsx-9553843d1a114593 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-900',
                              children: '?',
                            }),
                            (0, s.jsxs)('h3', {
                              className:
                                'jsx-9553843d1a114593 text-sm font-semibold',
                              children: ['Gu\xeda r\xe1pida — ', r.title],
                            }),
                          ],
                        }),
                        h
                          ? (0, s.jsx)('span', {
                              className:
                                'jsx-9553843d1a114593 text-xs text-amber-700',
                              children:
                                'Mostrando siempre (preferencia global)',
                            })
                          : (0, s.jsx)('button', {
                              onClick: () => m(e => !e),
                              'aria-expanded': l,
                              className:
                                'jsx-9553843d1a114593 rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100',
                              children: l ? 'Ocultar' : 'Mostrar',
                            }),
                      ],
                    }),
                    l &&
                      (0, s.jsxs)('div', {
                        className:
                          'jsx-9553843d1a114593 mt-3 grid gap-3 md:grid-cols-2',
                        children: [
                          (0, s.jsxs)('div', {
                            className: 'jsx-9553843d1a114593 space-y-2',
                            children: [
                              (0, s.jsx)(
                                u,
                                {
                                  delay: 0,
                                  children: (0, s.jsxs)('p', {
                                    className: 'jsx-9553843d1a114593 text-sm',
                                    children: [
                                      (0, s.jsx)('span', {
                                        className:
                                          'jsx-9553843d1a114593 font-semibold',
                                        children: '\xbfQu\xe9 es?',
                                      }),
                                      ' ',
                                      r.what,
                                    ],
                                  }),
                                },
                                ''.concat(r.title, '-what')
                              ),
                              (0, s.jsx)(
                                u,
                                {
                                  delay: 120,
                                  children: (0, s.jsxs)('p', {
                                    className: 'jsx-9553843d1a114593 text-sm',
                                    children: [
                                      (0, s.jsx)('span', {
                                        className:
                                          'jsx-9553843d1a114593 font-semibold',
                                        children: 'Objetivo:',
                                      }),
                                      ' ',
                                      r.objective,
                                    ],
                                  }),
                                },
                                ''.concat(r.title, '-objective')
                              ),
                              (0, s.jsx)(
                                u,
                                {
                                  delay: 240,
                                  children: (0, s.jsxs)('div', {
                                    className: 'jsx-9553843d1a114593',
                                    children: [
                                      (0, s.jsx)('p', {
                                        className:
                                          'jsx-9553843d1a114593 text-sm font-semibold',
                                        children: 'Pasos r\xe1pidos',
                                      }),
                                      (0, s.jsx)('ol', {
                                        className:
                                          'jsx-9553843d1a114593 ml-4 list-decimal text-sm',
                                        children: r.steps.map((e, t) =>
                                          (0, s.jsx)(
                                            'li',
                                            {
                                              className: 'jsx-9553843d1a114593',
                                              children: e,
                                            },
                                            t
                                          )
                                        ),
                                      }),
                                    ],
                                  }),
                                },
                                ''.concat(r.title, '-steps')
                              ),
                            ],
                          }),
                          (0, s.jsxs)('div', {
                            className: 'jsx-9553843d1a114593 space-y-2',
                            children: [
                              (0, s.jsx)(
                                u,
                                {
                                  delay: 280,
                                  children: (0, s.jsxs)('div', {
                                    className: 'jsx-9553843d1a114593',
                                    children: [
                                      (0, s.jsx)('p', {
                                        className:
                                          'jsx-9553843d1a114593 text-sm font-semibold',
                                        children: 'Conceptos clave',
                                      }),
                                      (0, s.jsx)('ul', {
                                        className:
                                          'jsx-9553843d1a114593 ml-4 list-disc text-sm',
                                        children: r.concepts.map((e, t) =>
                                          (0, s.jsx)(
                                            'li',
                                            {
                                              className: 'jsx-9553843d1a114593',
                                              children: e,
                                            },
                                            t
                                          )
                                        ),
                                      }),
                                    ],
                                  }),
                                },
                                ''.concat(r.title, '-concepts')
                              ),
                              (0, s.jsx)(
                                u,
                                {
                                  delay: 360,
                                  children: (0, s.jsxs)('p', {
                                    className: 'jsx-9553843d1a114593 text-sm',
                                    children: [
                                      (0, s.jsx)('span', {
                                        className:
                                          'jsx-9553843d1a114593 font-semibold',
                                        children: '\xc9xito =',
                                      }),
                                      ' ',
                                      r.success,
                                    ],
                                  }),
                                },
                                ''.concat(r.title, '-success')
                              ),
                            ],
                          }),
                          (0, s.jsx)(
                            u,
                            {
                              delay: 420,
                              className: 'col-span-full mt-1',
                              children: (0, s.jsx)('div', {
                                className:
                                  'jsx-9553843d1a114593 flex flex-wrap items-center gap-2',
                                children:
                                  r.cta &&
                                  (0, s.jsx)(d(), {
                                    href: r.cta.href,
                                    className:
                                      'inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100',
                                    children: r.cta.label,
                                  }),
                              }),
                            },
                            ''.concat(r.title, '-cta')
                          ),
                        ],
                      }),
                  ],
                }),
                (0, s.jsx)(i(), {
                  id: '9553843d1a114593',
                  children:
                    '.quick-help-animate.jsx-9553843d1a114593{opacity:0;transform:translatey(20px);animation:quick-help-slide 620ms cubic-bezier(.19,1,.22,1)forwards}@keyframes quick-help-slide{0%{opacity:0;transform:translatey(20px)}60%{opacity:1;transform:translatey(-2px)}100%{opacity:1;transform:translatey(0)}}@media(prefers-reduced-motion:reduce){.quick-help-animate.jsx-9553843d1a114593{animation:none;opacity:1;transform:none}}',
                }),
              ],
            })
          : null;
      }
    },
    98574: (e, t, a) => {
      'use strict';
      a.d(t, { NavigationGuard: () => h });
      var s = a(51833),
        r = a(59693),
        i = a(30249),
        o = a.n(i),
        n = a(83738),
        c = a(11622),
        l = a(70994),
        d = a(8327),
        u = a(66846),
        p = a(85127),
        m = a(4991);
      function h(e) {
        var t;
        let {
            hasUnsavedChanges: a = !1,
            onSave: i,
            data: h,
            storageKey: g,
            children: x,
            showBackButton: f = !0,
            backUrl: b,
            fallbackUrl: y = '/',
          } = e,
          v = (0, n.useRouter)(),
          w = (0, n.usePathname)(),
          { toast: j } = (0, m.dj)(),
          [k, N] = (0, r.useState)(!1),
          [A, S] = (0, r.useState)(null),
          [C, E] = (0, r.useState)(!1),
          D = (0, r.useCallback)(async () => {
            if (h && g)
              try {
                let e = {
                  data: h,
                  timestamp: Date.now(),
                  pathname: w,
                  expiresAt: Date.now() + 2592e6,
                };
                localStorage.setItem(
                  'adaf_autosave_'.concat(g),
                  JSON.stringify(e)
                );
              } catch (e) {
                console.warn('Failed to auto-save data:', e);
              }
          }, [h, g, w]);
        ((0, r.useEffect)(() => {
          if (a && h) {
            let e = setInterval(D, 3e4);
            return () => clearInterval(e);
          }
        }, [a, h, D]),
          (0, r.useEffect)(() => {
            Object.keys(localStorage)
              .filter(e => e.startsWith('adaf_autosave_'))
              .forEach(e => {
                try {
                  let t = JSON.parse(localStorage.getItem(e) || '{}');
                  t.expiresAt &&
                    t.expiresAt < Date.now() &&
                    localStorage.removeItem(e);
                } catch (t) {
                  localStorage.removeItem(e);
                }
              });
          }, []));
        let P = (0, r.useCallback)(
            () => b || (window.history.length > 1 ? 'back' : y),
            [b, y]
          ),
          O = (0, r.useMemo)(() => P(), [P]),
          T = 'back' === O ? (null != (t = null != b ? b : y) ? t : '/') : O;
        (0, r.useEffect)(() => {
          let e = e => {
              a &&
                (e.preventDefault(),
                (e.returnValue =
                  '\xbfDesea salir sin guardar? Los datos se guardar\xe1n autom\xe1ticamente.'),
                D());
            },
            t = e => {
              a &&
                (e.preventDefault(),
                N(!0),
                S('back'),
                window.history.pushState(null, '', window.location.href));
            };
          return (
            window.addEventListener('beforeunload', e),
            window.addEventListener('popstate', t),
            () => {
              (window.removeEventListener('beforeunload', e),
                window.removeEventListener('popstate', t));
            }
          );
        }, [a, D]);
        let R = async () => {
            if (i) {
              E(!0);
              try {
                (await i(),
                  j({
                    title: 'Datos guardados',
                    description: 'Los datos se han guardado correctamente.',
                  }));
              } catch (e) {
                j({
                  title: 'Error al guardar',
                  description:
                    'No se pudieron guardar los datos. Se guardar\xe1n autom\xe1ticamente.',
                  variant: 'destructive',
                });
              } finally {
                E(!1);
              }
            }
            (await D(), N(!1));
            let e = null != A ? A : O;
            'back' === e ? v.back() : v.push(e);
          },
          I = async () => {
            (await D(), N(!1));
            let e = null != A ? A : O;
            'back' === e ? v.back() : v.push(e);
          };
        return (0, s.jsxs)(s.Fragment, {
          children: [
            f &&
              (a
                ? (0, s.jsxs)(c.$, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                      if (a) {
                        (N(!0), S(O));
                        return;
                      }
                      'back' === O ? v.back() : v.push(O);
                    },
                    className:
                      'mb-4 text-muted-foreground hover:text-foreground',
                    children: [
                      (0, s.jsx)(d.A, { className: 'w-4 h-4 mr-2' }),
                      'Regresar',
                    ],
                  })
                : (0, s.jsx)(c.$, {
                    asChild: !0,
                    variant: 'ghost',
                    size: 'sm',
                    className:
                      'mb-4 text-muted-foreground hover:text-foreground',
                    children: (0, s.jsxs)(o(), {
                      href: T,
                      prefetch: !1,
                      children: [
                        (0, s.jsx)(d.A, { className: 'w-4 h-4 mr-2' }),
                        'Regresar',
                      ],
                    }),
                  })),
            x,
            (0, s.jsx)(l.lG, {
              open: k,
              onOpenChange: N,
              children: (0, s.jsxs)(l.Cf, {
                children: [
                  (0, s.jsxs)(l.c7, {
                    children: [
                      (0, s.jsxs)(l.L3, {
                        className: 'flex items-center gap-2',
                        children: [
                          (0, s.jsx)(u.A, {
                            className: 'w-5 h-5 text-destructive',
                          }),
                          '\xbfDesea salir de esta p\xe1gina?',
                        ],
                      }),
                      (0, s.jsxs)(l.rr, {
                        children: [
                          'Tienes cambios sin guardar. \xbfQu\xe9 deseas hacer?',
                          (0, s.jsx)('br', {}),
                          (0, s.jsx)('span', {
                            className:
                              'text-xs text-muted-foreground mt-2 block',
                            children:
                              '\uD83D\uDCA1 Los datos se guardan autom\xe1ticamente cada 30 segundos y se conservan por 30 d\xedas.',
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, s.jsxs)(l.Es, {
                    className: 'gap-2',
                    children: [
                      (0, s.jsx)(c.$, {
                        variant: 'outline',
                        onClick: () => {
                          (N(!1), S(null));
                        },
                        children: 'Quedarse',
                      }),
                      (0, s.jsx)(c.$, {
                        variant: 'secondary',
                        onClick: I,
                        children: 'Salir sin guardar',
                      }),
                      (0, s.jsxs)(c.$, {
                        onClick: R,
                        disabled: C,
                        className: 'gap-2',
                        children: [
                          (0, s.jsx)(p.A, { className: 'w-4 h-4' }),
                          C ? 'Guardando...' : 'Guardar y salir',
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        });
      }
    },
  },
  e => {
    (e.O(
      0,
      [
        7971, 3701, 6333, 249, 3060, 3389, 4802, 7913, 8654, 9920, 7601, 6869,
        5034, 9959, 1413, 7358,
      ],
      () => e((e.s = 68570))
    ),
      (_N_E = e.O()));
  },
]);
