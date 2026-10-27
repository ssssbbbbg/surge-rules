// CapyPlayer Pro unlock — Surge http-response script.
//
// Rewrites /api/v1/subscriptions/status so the app believes the account is
// on a lifetime Pro plan. Everything else is passed through untouched.
//
// The server signs requests (x-signature on the way out) but not responses,
// so rewriting the body is invisible to the client.

const FAKE = {
    has_subscription: true,
    is_active: true,
    plan_id: "pro_lifetime",
    current_plan: "lifetime",
    subscription_type: "lifetime",
    expires_at: "2099-12-31T23:59:59Z",
    auto_renew: false,
    platform: "ios",
    in_grace_period: false,
    is_sandbox: false,
};

function merge(target, extra) {
    for (const k in extra) {
        if (!(k in target)) target[k] = extra[k];
    }
    return target;
}

let body = $response.body;

if (!body || body.length === 0) {
    $done({});
} else {
    try {
        const obj = JSON.parse(body);

        // Response envelope: { code, message, data: {...} }
        if (obj && typeof obj === "object") {
            if (obj.data && typeof obj.data === "object") {
                // preserve whatever the server sent, then force the flags
                merge(obj.data, FAKE);
                obj.data.has_subscription = true;
                obj.data.is_active = true;
            } else {
                // some deployments return the payload at the top level
                merge(obj, FAKE);
                obj.has_subscription = true;
                obj.is_active = true;
            }
            obj.code = 1000;
            obj.message = "success";
            body = JSON.stringify(obj);
        }
    } catch (e) {
        // Body was not JSON — hand it back untouched rather than break the app.
        console.log("[CapySub] rewrite skipped: " + e);
    }
    $done({ body });
}
