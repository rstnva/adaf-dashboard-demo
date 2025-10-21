exports.id=5801,exports.ids=[5801],exports.modules={56161:()=>{},61705:(a,b,c)=>{"use strict";function d(a){return isNaN(a)||!isFinite(a)?0:Math.max(-2,Math.min(2,a))}function e(a){let b=[],c=[];for(let c of["irr","tvpi","moic","dpi","rvpi","navUsd"]){let d=a[c];(null==d||isNaN(d))&&b.push(`${c.toUpperCase()} data insufficient or missing`)}return(!a.flows||isNaN(a.flows.in)||isNaN(a.flows.out))&&b.push("Flows data insufficient or missing"),"number"==typeof a.tvpi&&a.tvpi<0&&b.push("TVPI should not be negative"),"number"==typeof a.navUsd&&a.navUsd<0&&b.push("NAV should not be negative"),{isValid:0===c.length,warnings:b,errors:c}}function f(a){let b=[],c=[];return a.chains&&0!==a.chains.length?a.chains.forEach((a,d)=>{a.chain&&0!==a.chain.length||c.push(`Chain ${d}: missing chain identifier`),("number"!=typeof a.assetsUsd||isNaN(a.assetsUsd))&&b.push(`Chain ${a.chain}: assets value missing or invalid`),("number"!=typeof a.addrCount||a.addrCount<0)&&b.push(`Chain ${a.chain}: address count invalid`)}):b.push("No PoR chain data available"),("number"!=typeof a.totalUsd||isNaN(a.totalUsd))&&b.push("Total PoR USD value missing or invalid"),{isValid:0===c.length,warnings:b,errors:c}}function g(){return{irr:0,tvpi:1,moic:1,dpi:0,rvpi:1,navUsd:0,flows:{in:0,out:0},ts:new Date().toISOString()}}function h(a){let b=g();return{irr:d(a.irr??b.irr),tvpi:"number"!=typeof a.tvpi||isNaN(a.tvpi)?b.tvpi:Math.max(0,a.tvpi),moic:"number"!=typeof a.moic||isNaN(a.moic)?b.moic:Math.max(0,a.moic),dpi:"number"!=typeof a.dpi||isNaN(a.dpi)?b.dpi:Math.max(0,a.dpi),rvpi:"number"!=typeof a.rvpi||isNaN(a.rvpi)?b.rvpi:Math.max(0,a.rvpi),navUsd:"number"!=typeof a.navUsd||isNaN(a.navUsd)?b.navUsd:Math.max(0,a.navUsd),flows:{in:"number"!=typeof a.flows?.in||isNaN(a.flows.in)?b.flows.in:Math.max(0,a.flows.in),out:"number"!=typeof a.flows?.out||isNaN(a.flows.out)?b.flows.out:Math.max(0,a.flows.out)},ts:a.ts||b.ts}}function i(){return{chains:[],totalUsd:0,ts:new Date().toISOString()}}function j(a){let b=i();if(!a.chains||0===a.chains.length)return b;let c=a.chains.filter(a=>a.chain&&"number"==typeof a.assetsUsd&&!isNaN(a.assetsUsd)).map(a=>({chain:a.chain,custodian:a.custodian||null,addrCount:Math.max(0,Math.floor(a.addrCount||0)),assetsUsd:Math.max(0,a.assetsUsd)})),d=c.reduce((a,b)=>a+b.assetsUsd,0);return{chains:c,totalUsd:d,ts:a.ts||b.ts}}function k(a=new Date){let b=a.getFullYear(),c=Math.floor(a.getMonth()/3)+1;return`${b}Q${c}`}function l(a){return/^\d{4}Q[1-4]$/.test(a)}c.d(b,{On:()=>k,W0:()=>f,bI:()=>d,fi:()=>g,j4:()=>l,nx:()=>i,o9:()=>j,sP:()=>e,uu:()=>h})},80886:(a,b,c)=>{"use strict";c.a(a,async(a,d)=>{try{c.d(b,{o:()=>h});var e=c(83237),f=a([e]);async function g(a,b){let c;try{c=await e.chromium.launch({headless:!0,args:["--no-sandbox","--disable-dev-shm-usage"]});let d=await c.newPage();await d.setContent(a,{waitUntil:"networkidle"});let f=(await d.pdf({path:b,format:"A4",margin:{top:"15mm",right:"15mm",bottom:"15mm",left:"15mm"},printBackground:!0,preferCSSPageSize:!0})).length;return{success:!0,filePath:b,fileSizeBytes:f}}catch(a){return console.error("[PDF] Generation error:",a),{success:!1,error:a instanceof Error?a.message:"Unknown PDF generation error"}}finally{c&&await c.close()}}async function h(a){try{let b="onepager"===a.type?function(a){let{kpis:b,por:c,generatedAt:d,actor:e,notes:f}=a;return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ADAF — Institutional One-Pager</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1f2937;
      background: white;
    }
    .page { 
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
    }
    .header { 
      text-align: center;
      margin-bottom: 24pt;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 12pt;
    }
    .logo { 
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.5pt;
    }
    .subtitle { 
      font-size: 12pt;
      color: #6b7280;
      margin-top: 4pt;
    }
    .kpis-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12pt;
      margin: 20pt 0;
    }
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6pt;
      padding: 12pt;
      text-align: center;
    }
    .kpi-label {
      font-size: 9pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-bottom: 4pt;
    }
    .kpi-value {
      font-size: 18pt;
      font-weight: 700;
      color: #111827;
    }
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: #111827;
      margin: 16pt 0 8pt 0;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4pt;
    }
    .por-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
    }
    .por-table th,
    .por-table td {
      padding: 6pt 8pt;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .por-table th {
      background: #f3f4f6;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      color: #374151;
    }
    .por-table td {
      font-size: 10pt;
    }
    .amount {
      text-align: right;
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 9pt;
    }
    .footer {
      margin-top: 20pt;
      padding-top: 12pt;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #6b7280;
      text-align: center;
    }
    .meta-info {
      margin-top: 16pt;
      font-size: 9pt;
      color: #6b7280;
    }
    .nav-summary {
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 6pt;
      padding: 12pt;
      margin: 12pt 0;
    }
    .nav-amount {
      font-size: 20pt;
      font-weight: 700;
      color: #1d4ed8;
      font-family: 'SF Mono', Consolas, monospace;
    }
    .flows {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8pt;
      margin-top: 8pt;
    }
    .flow-item {
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
    }
    .positive { color: #059669; }
    .negative { color: #dc2626; }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <div class="logo">ADAF</div>
      <div class="subtitle">Institutional One-Pager Report</div>
    </header>

    <div class="nav-summary">
      <div style="font-size: 10pt; color: #6b7280; margin-bottom: 4pt;">Net Asset Value</div>
      <div class="nav-amount">$${(b.navUsd||0).toLocaleString()}</div>
      <div class="flows">
        <div class="flow-item">
          <span>Inflows:</span>
          <span class="positive">$${(b.flows?.in||0).toLocaleString()}</span>
        </div>
        <div class="flow-item">
          <span>Outflows:</span>
          <span class="negative">-$${(b.flows?.out||0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="section-title">Performance KPIs</div>
    <div class="kpis-grid">
      <div class="kpi-card">
        <div class="kpi-label">IRR</div>
        <div class="kpi-value">${(100*b.irr).toFixed(1)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">TVPI</div>
        <div class="kpi-value">${b.tvpi.toFixed(2)}x</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">MoIC</div>
        <div class="kpi-value">${b.moic.toFixed(2)}x</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">DPI</div>
        <div class="kpi-value">${b.dpi.toFixed(2)}x</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">RVPI</div>
        <div class="kpi-value">${b.rvpi.toFixed(2)}x</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Date</div>
        <div class="kpi-value" style="font-size: 10pt;">${new Date(b.ts).toLocaleDateString()}</div>
      </div>
    </div>

    <div class="section-title">Proof of Reserves</div>
    <table class="por-table">
      <thead>
        <tr>
          <th>Chain</th>
          <th>Custodian</th>
          <th>Addresses</th>
          <th class="amount">Assets (USD)</th>
        </tr>
      </thead>
      <tbody>
        ${c.chains.map(a=>`
          <tr>
            <td><strong>${a.chain}</strong></td>
            <td>${a.custodian||"Self-custody"}</td>
            <td>${a.addrCount}</td>
            <td class="amount">$${a.assetsUsd.toLocaleString()}</td>
          </tr>
        `).join("")}
        <tr style="border-top: 2px solid #374151; font-weight: 600;">
          <td colspan="3"><strong>Total</strong></td>
          <td class="amount"><strong>$${c.totalUsd.toLocaleString()}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="meta-info">
      <div>Generated: ${new Date(d).toLocaleString()}</div>
      <div>By: ${e}</div>
      ${f?`<div>Notes: ${f}</div>`:""}
    </div>

    <div class="footer">
      <div>ADAF — Institutional Investment Management</div>
      <div>This report contains confidential and proprietary information. Distribution is restricted.</div>
    </div>
  </div>
</body>
</html>
  `}(a.data):function(a){let{kpis:b,por:c,quarter:d,generatedAt:e,notes:f}=a;return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ADAF — Quarterly Report ${d}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    .page { 
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }
    .page:last-child { page-break-after: avoid; }
    .cover {
      text-align: center;
      padding-top: 40mm;
    }
    .cover .logo { 
      font-size: 36pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: -1pt;
      margin-bottom: 12pt;
    }
    .cover .title { 
      font-size: 24pt;
      color: #374151;
      margin-bottom: 8pt;
    }
    .cover .quarter { 
      font-size: 18pt;
      color: #6b7280;
      margin-bottom: 40pt;
    }
    .section-title {
      font-size: 16pt;
      font-weight: 600;
      color: #111827;
      margin: 20pt 0 12pt 0;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 6pt;
    }
    .kpis-detailed {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16pt;
      margin: 16pt 0;
    }
    .kpi-detailed {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8pt;
      padding: 16pt;
    }
    .kpi-detailed .label {
      font-size: 10pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-bottom: 6pt;
    }
    .kpi-detailed .value {
      font-size: 24pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8pt;
    }
    .kpi-detailed .description {
      font-size: 9pt;
      color: #6b7280;
      line-height: 1.3;
    }
    .methodology {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 6pt;
      padding: 12pt;
      margin: 16pt 0;
      font-size: 9pt;
    }
    .methodology .title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 6pt;
    }
    .por-detailed {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    .por-detailed th,
    .por-detailed td {
      padding: 8pt;
      text-align: left;
      border: 1px solid #e5e7eb;
    }
    .por-detailed th {
      background: #f3f4f6;
      font-weight: 600;
      font-size: 10pt;
      text-transform: uppercase;
      color: #374151;
    }
    .disclaimer {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6pt;
      padding: 12pt;
      margin: 20pt 0;
      font-size: 8pt;
      line-height: 1.4;
    }
    .disclaimer .title {
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 6pt;
    }
    .footer {
      position: fixed;
      bottom: 15mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #6b7280;
    }
    .page-number::after {
      content: counter(page);
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover">
    <div class="logo">ADAF</div>
    <div class="title">Quarterly Investment Report</div>
    <div class="quarter">${d||"Q3 2025"}</div>
    
    <div style="margin-top: 40pt; font-size: 12pt; color: #6b7280;">
      <div>Institutional Grade</div>
      <div>Digital Asset Management</div>
    </div>
    
    <div style="position: absolute; bottom: 40mm; left: 0; right: 0; text-align: center; font-size: 9pt; color: #9ca3af;">
      Generated ${new Date(e).toLocaleDateString()}<br>
      Confidential & Proprietary
    </div>
  </div>

  <!-- KPIs & Performance Page -->
  <div class="page">
    <div class="section-title">Performance Overview</div>
    
    <div class="kpis-detailed">
      <div class="kpi-detailed">
        <div class="label">Internal Rate of Return</div>
        <div class="value">${(100*b.irr).toFixed(1)}%</div>
        <div class="description">Annualized return rate accounting for timing and magnitude of cash flows</div>
      </div>
      <div class="kpi-detailed">
        <div class="label">Total Value / Paid-In</div>
        <div class="value">${b.tvpi.toFixed(2)}x</div>
        <div class="description">Total portfolio value relative to cumulative invested capital</div>
      </div>
      <div class="kpi-detailed">
        <div class="label">Multiple on Invested Capital</div>
        <div class="value">${b.moic.toFixed(2)}x</div>
        <div class="description">Gross return multiple before fees and carried interest</div>
      </div>
      <div class="kpi-detailed">
        <div class="label">Distributions / Paid-In</div>
        <div class="value">${b.dpi.toFixed(2)}x</div>
        <div class="description">Ratio of cumulative distributions to invested capital</div>
      </div>
    </div>

    <div class="methodology">
      <div class="title">Methodology Note</div>
      <div>Performance metrics calculated using industry-standard GIPS methodology. IRR computed using daily cash flows and mark-to-market valuations. All figures presented gross of management fees.</div>
    </div>

    <div class="section-title">Portfolio Summary</div>
    
    <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8pt; padding: 16pt; margin: 12pt 0;">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16pt; text-align: center;">
        <div>
          <div style="font-size: 10pt; color: #6b7280;">Net Asset Value</div>
          <div style="font-size: 20pt; font-weight: 700; color: #1d4ed8;">$${(b.navUsd||0).toLocaleString()}</div>
        </div>
        <div>
          <div style="font-size: 10pt; color: #6b7280;">Inflows (QTD)</div>
          <div style="font-size: 16pt; font-weight: 600; color: #059669;">$${(b.flows?.in||0).toLocaleString()}</div>
        </div>
        <div>
          <div style="font-size: 10pt; color: #6b7280;">Outflows (QTD)</div>
          <div style="font-size: 16pt; font-weight: 600; color: #dc2626;">$${(b.flows?.out||0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Proof of Reserves Page -->
  <div class="page">
    <div class="section-title">Proof of Reserves</div>
    
    <p style="margin: 12pt 0; font-size: 10pt; color: #6b7280;">
      On-chain verification of digital asset custody across multiple blockchains and custodial arrangements.
      All addresses and balances verified as of ${new Date(c.ts).toLocaleDateString()}.
    </p>

    <table class="por-detailed">
      <thead>
        <tr>
          <th>Blockchain</th>
          <th>Custodian</th>
          <th>Address Count</th>
          <th style="text-align: right;">Assets (USD)</th>
          <th>Last Verified</th>
        </tr>
      </thead>
      <tbody>
        ${c.chains.map(a=>`
          <tr>
            <td><strong>${a.chain}</strong></td>
            <td>${a.custodian||"Self-custody"}</td>
            <td>${a.addrCount}</td>
            <td style="text-align: right; font-family: monospace;">$${a.assetsUsd.toLocaleString()}</td>
            <td style="font-size: 9pt; color: #6b7280;">${new Date(c.ts).toLocaleDateString()}</td>
          </tr>
        `).join("")}
        <tr style="border-top: 2px solid #374151; font-weight: 600; background: #f9fafb;">
          <td colspan="3"><strong>Total Verified Assets</strong></td>
          <td style="text-align: right; font-family: monospace;"><strong>$${c.totalUsd.toLocaleString()}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="disclaimer">
      <div class="title">Important Disclaimers</div>
      <div>
        <strong>Risk Disclosure:</strong> Digital asset investments involve substantial risk of loss. Past performance does not guarantee future results.
        <strong>Methodology:</strong> IRR calculated using daily cash flows; TVPI and MoIC based on fair market valuations; DPI reflects actual distributions.
        <strong>Compliance:</strong> This report is prepared in accordance with AIFMD and institutional reporting standards.
        ${f?`<br><strong>Notes:</strong> ${f}`:""}
      </div>
    </div>
  </div>

  <div class="footer">
    <div>ADAF Institutional Investment Management | Confidential & Proprietary | Page <span class="page-number"></span></div>
  </div>
</body>
</html>
  `}(a.data),c=new Date().toISOString().split("T")[0],d="onepager"===a.type?`OnePager_${c}.pdf`:`Quarterly_${a.data.quarter||c}.pdf`,e=`/tmp/${d}`,f=await g(b,e);return f.success&&console.log(`[PDF] Generated ${a.type} report: ${d} (${f.fileSizeBytes} bytes)`),f}catch(a){return console.error("[PDF] Report generation error:",a),{success:!1,error:a instanceof Error?a.message:"Unknown report generation error"}}}e=(f.then?(await f)():f)[0],d()}catch(a){d(a)}})},92609:()=>{}};