/* =============================================================================
 * Scripted REST API resource — GET FAQs
 * =============================================================================
 * Returns every ACTIVE FAQ as a flat JSON list, sorted by u_order DESCENDING.
 * The public page decides where each FAQ shows, using "associated_to":
 *   - associated_to = <course sys_id>  -> shows ONLY on that course's page
 *   - associated_to = empty/null       -> "global": shows on the home page AND
 *                                          on every course page
 *
 *   { result: [
 *       { sys_id, question, answer, associated_to, course_name, order }, ...
 *   ] }   // associated_to = '' means global
 *
 * Anonymous + read-only; no credentials.
 *
 * TABLE  : x_palni_servicen_1_faqs
 * FIELDS : u_question, u_answer, u_associated_to (ref -> course_offerings),
 *          u_order (number), u_active (boolean)
 *
 * DEPLOY AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get FAQs
 *   HTTP method       : GET
 *   Relative path     : /get_faqs
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_faqs
 *
 * REQUIRED OPERATION SETTINGS (all OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF   <- defaults to true; blocks guest
 *
 * CORS: covered by the existing "TeamProfile" CORS rule on the Team Profiles
 * REST API (allows the GitHub Pages domain + GET).
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var TABLE = 'x_palni_servicen_1_faqs';
    var out = [];

    var gr = new GlideRecord(TABLE);
    gr.addQuery('u_active', true);     // only active FAQs
    gr.orderByDesc('u_order');         // descending order
    gr.query();
    while (gr.next()) {
        out.push({
            sys_id:        gr.getUniqueValue(),
            question:      gr.getValue('u_question'),
            answer:        gr.getValue('u_answer'),
            associated_to: gr.getValue('u_associated_to') || '',         // course sys_id; '' = global
            course_name:   gr.getDisplayValue('u_associated_to') || '',  // for reference/debugging
            order:         gr.getValue('u_order') || ''
        });
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: out }));

})(request, response);
