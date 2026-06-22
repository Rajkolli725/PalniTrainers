/* =============================================================================
 * Scripted REST API resource — POST website lead (lead generation)
 * =============================================================================
 * Receives a lead from the public website's forms (hero, contact, course CTAs,
 * and the "Book a Free Demo" modal) and inserts ONE row into a custom Leads
 * table. Anonymous + public — no credentials / X-UserToken in the web page.
 *
 *   Leads table : x_palni_servicen_1_lead   (create this — see fields below)
 *
 * CREATE THE LEADS TABLE FIRST (System Definition > Tables), scope
 * x_palni_servicen_1, with these columns:
 *   u_name            (String, 100)
 *   u_email           (String, 100)
 *   u_phone           (String, 40)
 *   u_company         (String, 100)
 *   u_course_interest (String, 100)
 *   u_training_mode   (String, 60)
 *   u_message         (String, 1000)
 *   u_source          (String, 60)     // which form the lead came from
 *   u_status          (Choice/String)  // optional: New / Contacted / Qualified…
 * (A "number" field auto-comes from extending Task, or just use sys_id.)
 *
 * DEPLOYED AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Post Lead
 *   HTTP method       : POST
 *   Relative path     : /post_lead
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/post_lead
 *
 * REQUIRED OPERATION SETTINGS (all OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF   <- defaults to true; blocks guest
 *
 * CORS: covered by the existing "TeamProfile" CORS rule (https://rajkolli725.github.io,
 * GET + POST, * headers — the * headers value satisfies the JSON pre-flight).
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var LEADS_TABLE = 'x_palni_servicen_1_lead';

    function reply(status, obj) {
        response.setStatus(status);
        response.setHeader('Content-Type', 'application/json');
        response.getStreamWriter().writeString(JSON.stringify(obj));
    }

    var body = {};
    try { body = request.body.data || {}; } catch (e) { body = {}; }

    // Map the page's clean keys -> the Leads table columns.
    var fieldMap = {
        u_name:            body.name,
        u_email:           body.email,
        u_phone:           body.phone,
        u_company:         body.company,
        u_course_interest: body.course,
        u_training_mode:   body.mode,
        u_message:         body.message,
        u_source:          body.source || 'Website'
    };

    // Minimal validation — a lead needs at least a name and an email.
    if (!fieldMap.u_name || !fieldMap.u_email) {
        reply(400, { status: 'error', error: 'name and email are required.' });
        return;
    }

    var gr = new GlideRecord(LEADS_TABLE);
    gr.newRecord();
    for (var col in fieldMap) {
        if (fieldMap[col] !== undefined && fieldMap[col] !== null && fieldMap[col] !== '') {
            gr.setValue(col, String(fieldMap[col]));
        }
    }
    var leadId = gr.insert();

    reply(201, { status: 'success', lead: leadId });

})(request, response);
