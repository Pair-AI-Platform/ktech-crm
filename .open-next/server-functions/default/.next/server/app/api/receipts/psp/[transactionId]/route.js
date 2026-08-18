(()=>{var a={};a.id=131,a.ids=[131],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},8128:a=>{"use strict";a.exports=require("next/dist/server/runtime-reacts.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},17305:(a,b,c)=>{"use strict";function d(a){return`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`}function e(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}c.d(b,{HN:()=>d,ZD:()=>e}),c(53858)},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},53858:(a,b,c)=>{"use strict";c.d(b,{GA:()=>l,Gv:()=>j,HP:()=>d,LS:()=>g,NC:()=>i,W_:()=>e,ll:()=>h,o7:()=>k,pY:()=>f});let{ENROLLMENT_PAYMENT_AMOUNT:d,FULL_TUITION_AMOUNT:e,PUC_FEE_AMOUNT:f,TEST_FEE_AMOUNT:g,GPA_SELF_FUNDED_THRESHOLD:h,PLACEMENT_TEST_PASSING_THRESHOLD:i,FILE_APPLICATION_FEE_AMOUNT:j,FILE_TEST_FEE_AMOUNT:k,PSP_FEE_AMOUNT:l}={ENROLLMENT_PAYMENT_AMOUNT:150,FULL_TUITION_AMOUNT:550,PUC_FEE_AMOUNT:10,TEST_FEE_AMOUNT:20,FILE_APPLICATION_FEE_AMOUNT:20,FILE_TEST_FEE_AMOUNT:15,PSP_FEE_AMOUNT:50,CURRENCY:"KWD",GPA_SELF_FUNDED_THRESHOLD:70,PLACEMENT_TEST_PASSING_THRESHOLD:60,PIPELINE_STAGES:["new","contacted","visit","test","application","applicant","enrolled","lost","withdraw"]}},57725:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>z,patchFetch:()=>y,routeModule:()=>u,serverHooks:()=>x,workAsyncStorage:()=>v,workUnitAsyncStorage:()=>w});var d=c(19225),e=c(84006),f=c(8317),g=c(99373),h=c(34775),i=c(24235),j=c(261),k=c(54365),l=c(90771),m=c(73461),n=c(67798),o=c(92280),p=c(62018),q=c(45696),r=c(47929),s=c(86439),t=c(37527);let u=new d.AppRouteRouteModule({definition:{kind:e.RouteKind.APP_ROUTE,page:"/api/receipts/psp/[transactionId]/route",pathname:"/api/receipts/psp/[transactionId]",filename:"route",bundlePath:"app/api/receipts/psp/[transactionId]/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/taha/Desktop/ourprojects/frontend/app/api/receipts/psp/[transactionId]/route.ts",nextConfigOutput:"standalone",userland:()=>c(63418),...{}}),{workAsyncStorage:v,workUnitAsyncStorage:w,serverHooks:x}=u;function y(){return(0,f.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:w})}async function z(a,b,c){c.requestMeta&&(0,g.setRequestMeta)(a,c.requestMeta),u.isDev&&(0,g.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/receipts/psp/[transactionId]/route";"/index"===d&&(d="/");let f=await u.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!f)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,deploymentId:w,params:x,nextConfig:y,parsedUrl:z,isDraftMode:A,prerenderManifest:B,routerServerContext:C,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,resolvedPathname:F,clientReferenceManifest:G,serverActionsManifest:H}=f,I=(0,j.normalizeAppPath)(d),J=!!(B.dynamicRoutes[I]||B.routes[F]),K=async()=>((null==C?void 0:C.render404)?await C.render404(a,b,z,!1):b.end("This page could not be found"),null);if(J&&!A){let a=!!B.routes[F],b=B.dynamicRoutes[I];if(b&&!1===b.fallback&&!a){if(y.adapterPath)return await K();throw new s.NoFallbackError}}let L=null;!J||u.isDev||A||(L="/index"===(L=F)?"/":L);let M=!0===u.isDev||!J,N=J&&!M;H&&G&&(0,i.setManifestsSingleton)({page:d,clientReferenceManifest:G,serverActionsManifest:H});let O=a.method||"GET",P=(0,h.getTracer)(),Q=P.getActiveScopeSpan(),R=!!(null==C?void 0:C.isWrappedByNextServer),S=!!(0,g.getRequestMeta)(a,"minimalMode"),T=(0,g.getRequestMeta)(a,"incrementalCache")||await u.getIncrementalCache(a,y,B,S);null==T||T.resetRequestCache(),globalThis.__incrementalCache=T;let U={params:x,previewProps:B.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts,useCacheTimeout:y.experimental.useCacheTimeout},cacheComponents:!!y.cacheComponents,validationLevel:y.experimental.instantInsights.validationLevel,supportsDynamicResponse:M,incrementalCache:T,hmrRefreshHash:(0,g.getRequestMeta)(a,"hmrRefreshHash"),cacheLifeProfiles:y.cacheLife,staticPageGenerationTimeout:y.staticPageGenerationTimeout,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>u.onRequestError(a,b,d,e,C)},sharedContext:{buildId:v,deploymentId:w}},V=new k.NodeNextRequest(a),W=new k.NodeNextResponse(b),X=l.NextRequestAdapter.fromNodeNextRequest(V,(0,l.signalFromNodeResponse)(b)),Y=async({previousCacheEntry:e})=>{try{if(!S&&D&&E&&!e)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await u.handle(X,U);a.fetchMetrics=U.renderOpts.fetchMetrics;let f=U.renderOpts.pendingWaitUntil;f&&c.waitUntil&&(c.waitUntil(f),f=void 0);let g=U.renderOpts.collectedTags;if(!J)return await (0,o.I)(V,W,d,f),null;{let a=await d.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(d.headers);g&&(b[r.NEXT_CACHE_TAGS_HEADER]=g),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==U.renderOpts.collectedRevalidate&&!(U.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&U.renderOpts.collectedRevalidate,e=void 0===U.renderOpts.collectedExpire||U.renderOpts.collectedExpire>=r.INFINITE_CACHE?!1!==c&&c>0?y.expireTime:void 0:U.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==e?void 0:e.isStale)&&await u.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),b}},Z=async(d,f)=>{try{var g,i;let d=await u.handleResponse({req:a,nextConfig:y,cacheKey:L,routeKind:e.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:B,isRoutePPREnabled:!1,isOnDemandRevalidate:D,revalidateOnlyGenerated:E,responseGenerator:Y,waitUntil:c.waitUntil,isMinimalMode:S});if(!J)return;if((null==d||null==(g=d.value)?void 0:g.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});S||b.setHeader("x-nextjs-cache",D?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),A&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);S&&J||f.delete(r.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||b.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,q.getCacheControlHeader)(d.cacheControl)),await (0,o.I)(V,W,new Response(d.value.body,{headers:f,status:d.value.status||200}));return}catch(b){if(b instanceof s.NoFallbackError||await u.onRequestError(a,b,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,n.getRevalidateReason)({isStaticGeneration:N,isOnDemandRevalidate:D})},!1,C),J)throw b;await (0,o.I)(V,W,new Response(null,{status:500}));return}finally{(()=>{if(!d)return;let a=b.statusCode;d.setAttributes({"http.status_code":a,"next.rsc":!1}),a&&a>=500&&(d.setStatus({code:h.SpanStatusCode.ERROR}),d.setAttribute("error.type",a.toString()));let c=P.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==m.BaseServerSpan.handleRequest)return console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route")||I,g=`${O} ${e}`;d.setAttributes({"next.route":e,"http.route":e,"next.span_name":g}),d.updateName(g),f&&f!==d&&(f.setAttribute("http.route",e),f.updateName(g))})()}};if(R&&Q)await Z(Q,void 0);else{let b=P.getActiveScopeSpan();await P.withPropagatedContext(a.headers,()=>P.trace(m.BaseServerSpan.handleRequest,{spanName:`${O} ${d}`,kind:h.SpanKind.SERVER,attributes:{"http.method":O,"http.target":a.url}},a=>Z(a,b)),void 0,!R)}}},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63418:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GET:()=>g});var d=c(23211),e=c(72880),f=c(17305);async function g(a,{params:b}){try{let{transactionId:a}=await b,c=await (0,e.zw)(),{data:{user:g},error:h}=await c.auth.getUser();if(h||!g)return d.NextResponse.json({error:"Unauthorized"},{status:401});let{data:i,error:j}=await c.from("payment_transactions").select("id, amount, currency, payment_method, status, cash_invoice_number, myfatoorah_invoice_id, myfatoorah_payment_id, notes, completed_at, created_at, lead:leads(id, first_name, last_name, first_name_ar, last_name_ar, civil_id, phone, email)").eq("id",a).single();if(j||!i)return d.NextResponse.json({error:"Transaction not found"},{status:404});if("completed"!==i.status)return d.NextResponse.json({error:"Payment has not been completed yet"},{status:400});let k=i.lead;if(!k)return d.NextResponse.json({error:"Lead not found"},{status:404});let l="Online Payment",m="دفع إلكتروني";"cash"===i.payment_method?(l="Cash",m="نقدي"):"bank_transfer"===i.payment_method&&(l="KNET",m="كي نت");let n=i.cash_invoice_number||i.myfatoorah_invoice_id||`PSP-${a.substring(0,8).toUpperCase()}`,o=i.completed_at?new Date(i.completed_at).toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}):new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}),p=i.completed_at?new Date(i.completed_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0}):"",q=`
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${(0,f.ZD)(k.first_name_ar||"")} ${(0,f.ZD)(k.last_name_ar||"")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5;
      padding: 24px;
      color: #1a1a2e;
      -webkit-font-smoothing: antialiased;
    }

    .receipt-wrapper {
      max-width: 520px;
      margin: 0 auto;
    }

    .receipt {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      padding: 32px 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.03);
      border-radius: 50%;
    }

    .header::after {
      content: '';
      position: absolute;
      bottom: -40%;
      left: -20%;
      width: 160px;
      height: 160px;
      background: rgba(255,255,255,0.02);
      border-radius: 50%;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .logo-text-ar {
      font-size: 15px;
      font-weight: 400;
      opacity: 0.85;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    }

    .receipt-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(10px);
      padding: 8px 18px;
      border-radius: 100px;
      margin-top: 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .receipt-badge svg {
      width: 16px;
      height: 16px;
    }

    /* Content */
    .content {
      padding: 28px;
    }

    /* Receipt Meta */
    .receipt-meta {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 1px dashed #e2e5e9;
      margin-bottom: 20px;
    }

    .meta-item {
      text-align: center;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 600;
      color: #8b95a5;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }

    .meta-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }

    /* Applicant Details */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #8b95a5;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 12px;
    }

    .details-card {
      background: #f8f9fb;
      border-radius: 10px;
      padding: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .detail-row:not(:last-child) {
      border-bottom: 1px solid #eef0f3;
    }

    .detail-label {
      font-size: 13px;
      color: #6b7685;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a2e;
      text-align: right;
    }

    /* Amount Section */
    .amount-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 20px;
    }

    .amount-label {
      font-size: 12px;
      font-weight: 600;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }

    .amount-value {
      font-size: 38px;
      font-weight: 700;
      color: #047857;
      line-height: 1.1;
    }

    .amount-currency {
      font-size: 16px;
      font-weight: 500;
      margin-left: 4px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      color: #047857;
      font-weight: 600;
      font-size: 14px;
    }

    .status-badge svg {
      width: 18px;
      height: 18px;
    }

    /* Payment Method Chip */
    .method-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
      background: #f0f2f5;
      color: #4a5568;
      margin-top: 8px;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 20px 28px;
      border-top: 1px solid #eef0f3;
      background: #fafbfc;
    }

    .footer p {
      font-size: 11px;
      color: #8b95a5;
      margin-bottom: 4px;
      line-height: 1.5;
    }

    .footer .thanks {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
      margin-top: 12px;
    }

    /* Print Styles */
    @media print {
      body {
        background: white;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt {
        box-shadow: none;
        border-radius: 0;
      }
      .no-print { display: none !important; }
    }

    /* Print Button */
    .actions {
      display: flex;
      gap: 10px;
      max-width: 520px;
      margin: 16px auto 0;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-primary {
      background: #1a1a2e;
      color: white;
    }

    .btn-primary:hover {
      background: #16213e;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: white;
      color: #1a1a2e;
      border: 1px solid #e2e5e9;
    }

    .btn-secondary:hover {
      background: #f8f9fb;
    }

    .btn svg {
      width: 18px;
      height: 18px;
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="receipt">
      <div class="header">
        <div class="logo-text">Kuwait Technical College</div>
        <div class="logo-text-ar">كلية الكويت التقنية</div>
        <div class="receipt-badge">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Payment Receipt / إيصال دفع
        </div>
      </div>

      <div class="content">
        <div class="receipt-meta">
          <div class="meta-item">
            <div class="meta-label">Receipt No.</div>
            <div class="meta-value">${(0,f.ZD)(n)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date</div>
            <div class="meta-value">${(0,f.ZD)(o)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Method</div>
            <div class="meta-value">${(0,f.ZD)(l)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Applicant Information</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${(0,f.ZD)(k.first_name_ar||"")} ${(0,f.ZD)(k.last_name_ar||"")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Civil ID</span>
              <span class="detail-value" style="font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.5px;">${(0,f.ZD)(k.civil_id||"N/A")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${(0,f.ZD)(k.phone||"N/A")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${(0,f.ZD)(k.email||"N/A")}</span>
            </div>
          </div>
        </div>

        <div class="amount-card">
          <div class="amount-label">Amount Paid / المبلغ المدفوع</div>
          <div class="amount-value">
            ${i.amount}<span class="amount-currency">KWD</span>
          </div>
          <div class="status-badge">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Payment Confirmed / تم التأكيد
          </div>
          <div class="method-chip">
            ${l} / ${m}${p?` &middot; ${p}`:""}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Description</div>
          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Description</span>
              <span class="detail-value">PSP Application Fees</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Currency</span>
              <span class="detail-value">${i.currency}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value" style="font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px;">${a.substring(0,8).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is an official receipt for PSP application fees.</p>
        <p>هذا إيصال رسمي لرسوم طلب التقديم</p>
        <p>For inquiries, contact the admissions office.</p>
        <p class="thanks">Thank you / شكراً لكم</p>
      </div>
    </div>

    <div class="actions no-print">
      <button class="btn btn-primary" onclick="window.print()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
        Print Receipt
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>
</body>
</html>
    `;return new d.NextResponse(q,{headers:{"Content-Type":"text/html"}})}catch(a){return console.error("[PSP Receipt] Error:",a),d.NextResponse.json({error:"Failed to generate receipt"},{status:500})}}},72880:(a,b,c)=>{"use strict";c.d(b,{HK:()=>j,VM:()=>i,zw:()=>g});var d=c(74968),e=c(59287),f=c(65573);async function g(){let a=await (0,f.UL)();return(0,d.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>a.getAll(),setAll(b){try{b.forEach(({name:b,value:c,options:d})=>a.set(b,c,d))}catch{}}}})}let h=(0,c(16949).unstable_cache)(async a=>{let b=j(),{data:c}=await b.from("profiles").select("id, email, full_name, full_name_ar, role, avatar_url, phone, is_active, monthly_target, created_at, updated_at").eq("id",a).single();return c??null},["user-profile"],{revalidate:300});async function i(){try{let a=await g(),{data:b,error:c}=await a.auth.getClaims(),d=b?.claims?.sub;if(c||!d)return null;try{let a=await h(d);if(a)return a}catch{}let{data:e}=await a.from("profiles").select("id, email, full_name, full_name_ar, role, avatar_url, phone, is_active, monthly_target, created_at, updated_at").eq("id",d).single();return e}catch(a){return console.error("Failed to get user profile:",a),null}}function j(){let a=process.env.NEXT_PUBLIC_SUPABASE_URL,b=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!a||!b)throw Error("Missing Supabase service role configuration");return(0,e.UU)(a,b,{auth:{autoRefreshToken:!1,persistSession:!1}})}},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,3115,9287,1813,3462],()=>b(b.s=57725));module.exports=c})();