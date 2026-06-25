/* =============================================================================
 * Scripted REST API resource — GET site properties
 * =============================================================================
 * Returns the System Properties (sys_properties) that belong to the
 * "ServiceNow Team Profiles" scope, as a { name: value } map, so the website
 * can read config to control its content/behavior without code changes.
 *
 *   Query: sys_scope.name = ServiceNow Team Profiles
 *
 * ⚠️ SECURITY: this endpoint is ANONYMOUS and returns EVERY property in that
 * scope. Do NOT store secrets (tokens, passwords, internal URLs) as scoped
 * properties, or set PUBLIC_PREFIX below so only intended page-config
 * properties are exposed (recommended). Example: name them
 *   x_palni_servicen_1.web.hero_headline, x_palni_servicen_1.web.show_reviews
 * and set PUBLIC_PREFIX = 'x_palni_servicen_1.web.'.
 *
 * DEPLOYED AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Properties
 *   HTTP method       : GET
 *   Relative path     : /get_properties
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_properties
 *
 * REQUIRED OPERATION SETTINGS (all OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF
 *
 * CORS: under the existing Team Profiles API, so the existing "TeamProfile"
 * CORS rule already covers it (GET). No change.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var SCOPE_NAME = 'ServiceNow Team Profiles';
    var PUBLIC_PREFIX = '';   // '' = all properties in the scope; set e.g. 'x_palni_servicen_1.web.' to expose only those

    var props = {};
    var gr = new GlideRecord('sys_properties');
    gr.addQuery('sys_scope.name', SCOPE_NAME);
    if (PUBLIC_PREFIX) gr.addQuery('name', 'STARTSWITH', PUBLIC_PREFIX);
    gr.orderBy('name');
    gr.query();
    while (gr.next()) {
        props[gr.getValue('name')] = gr.getValue('value');
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: props }));

})(request, response);
