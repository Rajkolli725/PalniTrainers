/* =============================================================================
 * Scripted REST API resource — GET trainee feedback (reviews)
 * =============================================================================
 * Returns every record from the custom table as a clean JSON list that the
 * public web page renders as review cards. No authentication, no credentials.
 *
 * DEPLOYED AS (current setup):
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Trainees FeedBack
 *   HTTP method       : GET
 *   Relative path     : /get_trainee_feedback
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_trainee_feedback
 *
 * REQUIRED OPERATION SETTINGS (all must be OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF   <- defaults to true; blocks guest
 *
 * CORS: covered by the existing "TeamProfile" CORS rule on the Team Profiles
 * REST API (allows https://rajkolli725.github.io, GET + POST, * headers).
 *
 * SECURITY NOTE: server-side GlideRecord does not enforce row-level ACLs, so
 * the guest user can read the data through this script even with no roles.
 * Only the read-only fields below are exposed.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var TABLE = 'x_palni_servicen_1_trainee_feedback';
    var out = [];

    var gr = new GlideRecord(TABLE);
    gr.orderByDesc('sys_created_on');
    gr.query();
    while (gr.next()) {
        out.push({
            number:      gr.getValue('number'),
            trainer:     gr.getValue('u_trainer'),
            trainee:     gr.getValue('u_trainee'),
            batch:       gr.getValue('u_batch'),
            comment:     gr.getValue('u_comment'),
            overall:     gr.getValue('u_overall_rating'),
            depth:       gr.getValue('u_depth_of_knowledge_covered'),
            clarity:     gr.getValue('u_clarity_of_explanation'),
            interaction: gr.getValue('u_interaction_with_participants'),
            handsOn:     gr.getValue('u_hands_on_experience'),
            realWorld:   gr.getValue('u_real_world_examples'),
            planning:    gr.getValue('u_session_planning_and_flow'),
            mentorship:  gr.getValue('u_mentorship_and_guidance'),
            recommend:   gr.getValue('u_likelihood_to_recommend_this_program'),
            created:     gr.getValue('sys_created_on')
        });
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: out }));

})(request, response);
