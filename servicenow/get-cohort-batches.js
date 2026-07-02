/* =============================================================================
 * Scripted REST API resource — GET upcoming cohort batches
 * =============================================================================
 * Returns every ACTIVE upcoming cohort batch as a clean JSON list. One call
 * serves both the website's HOME table (all rows) and each COURSE page's table
 * (the page filters rows by course_id). Anonymous + read-only; no credentials.
 *
 *     Table : x_palni_servicen_1_upcoming_cohort_batches
 *
 * Returned keys (per batch):
 *     number     <- number
 *     course     <- u_course (display value — the course name, for the home table)
 *     course_id  <- u_course (sys_id — the page filters the course table by this)
 *     batch      <- u_batch_name
 *     starts     <- u_start_date   (YYYY-MM-DD; the page formats it, e.g. "Jul 20, 2026")
 *     schedule   <- u_schedule
 *     mode       <- u_mode
 *
 * Rows are returned soonest-first (u_start_date ascending).
 *
 * DEPLOYED AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Cohort Batches
 *   HTTP method       : GET
 *   Relative path     : /get_cohort_batches
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_cohort_batches
 *
 * REQUIRED OPERATION SETTINGS (all OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF
 *
 * CORS: added under the existing "Team Profiles" REST API, so the existing
 *       "TeamProfile" CORS rule already covers it (domain + GET). No change.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var TABLE = 'x_palni_servicen_1_upcoming_cohort_batches';

    var out = [];
    var gr = new GlideRecord(TABLE);
    gr.addQuery('u_active', true);      // only active batches
    gr.orderBy('u_start_date');         // soonest first
    gr.query();
    while (gr.next()) {
        out.push({
            number:    gr.getValue('number'),
            course:    gr.getDisplayValue('u_course'),   // course name (home table column)
            course_id: gr.getValue('u_course'),          // course sys_id (course-page filter)
            batch:     gr.getValue('u_batch_name'),
            starts:    gr.getValue('u_start_date'),       // YYYY-MM-DD
            schedule:  gr.getValue('u_schedule'),
            mode:      gr.getValue('u_mode')
        });
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: out }));

})(request, response);
