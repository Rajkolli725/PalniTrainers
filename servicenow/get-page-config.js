/* =============================================================================
 * Scripted REST API resource — GET page configuration
 * =============================================================================
 * Returns editable page content from the single configuration record so the
 * website can pull rich (HTML) content that doesn't fit in a system property.
 * Anonymous + read-only; no credentials.
 *
 *     Table : x_palni_servicen_1_page_configurations
 *
 * Returned keys:
 *     enterprise  <- u_enterprise  (HTML field -> Enterprise section body on the home page)
 *
 * Uses the first record in the table (this is a single-row config table). Add
 * more fields to the response below as you add more configurable HTML areas.
 *
 * DEPLOYED AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Page Config
 *   HTTP method       : GET
 *   Relative path     : /get_page_config
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_page_config
 *
 * REQUIRED OPERATION SETTINGS (all OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF
 *
 * ⚠️ The u_enterprise value is rendered as HTML on the site — only trusted
 * admins should edit it.
 *
 * CORS: added under the existing "Team Profiles" REST API, so the existing
 *       "TeamProfile" CORS rule already covers it (domain + GET). No change.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var TABLE = 'x_palni_servicen_1_page_configurations';

    var cfg = { enterprise: '' };
    var gr = new GlideRecord(TABLE);
    gr.orderBy('sys_created_on');   // deterministic: earliest-created config row
    gr.setLimit(1);
    gr.query();
    if (gr.next()) {
        cfg.enterprise = gr.getValue('u_enterprise') || '';
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: cfg }));

})(request, response);
