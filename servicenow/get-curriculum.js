/* =============================================================================
 * Scripted REST API resource — GET course curriculum
 * =============================================================================
 * Returns the curriculum for ONE course, pre-grouped into the nested shape the
 * public course page renders directly (category -> lesson -> chapter):
 *
 *   { result: [
 *       { number: "01", title: <u_category>, lessons: [
 *           { number: "1.1", title: <u_lessions>, type: <u_type>, topics: [
 *               { title: <u_topics>, description: <u_short_description> }, ...
 *           ] }, ...
 *       ] }, ...
 *   ] }
 *
 * GROUPING (matches the page's Category -> Lesson -> Chapter UI):
 *   - Top level   : u_category                         (left-nav tab / section)
 *   - Lesson       : records grouped by u_lessions      (expandable accordion)
 *   - Chapter      : each record -> one chapter bullet  (u_topics + its
 *                    u_short_description shown beneath it)
 *   - Lesson badge : u_type of the LOWEST-u_order record in that lesson group
 *
 * ORDER & FILTER:
 *   - Only u_active = true records.
 *   - Sorted by u_order ascending. Category and lesson order follow first
 *     appearance (i.e. their lowest-order record), chapters follow u_order.
 *
 * Anonymous + read-only; no credentials.
 *
 * TABLE  : x_palni_servicen_1_curriculum
 * FIELDS : u_course_name (ref -> course sys_id), u_category, u_lessions,
 *          u_topics, u_short_description, u_type, u_order, u_active
 *
 * DEPLOY AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Curriculum
 *   HTTP method       : GET
 *   Relative path     : /get_curriculum
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_curriculum
 *   Query param       : ?course=<course sys_id>
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

    var TABLE = 'x_palni_servicen_1_curriculum';

    // ?course=<sys_id> — queryParams values arrive as arrays on most instances.
    var cp = request.queryParams.course;
    var course = cp ? ((cp instanceof Array) ? cp[0] : ('' + cp)) : '';

    var cats = [];          // ordered category objects: { title, _les, lessons:[] }
    var catIndex = {};      // category name -> index in cats

    var gr = new GlideRecord(TABLE);
    gr.addQuery('u_active', true);
    if (course) gr.addQuery('u_course_name', course);   // u_course_name stores the course sys_id
    gr.orderBy('u_order');                               // ascending
    gr.query();
    while (gr.next()) {
        var catName = gr.getValue('u_category') || 'General';
        var lesName = gr.getValue('u_lessions') || 'Lesson';

        // find or create the category (first appearance = lowest u_order)
        if (!catIndex.hasOwnProperty(catName)) {
            catIndex[catName] = cats.length;
            cats.push({ title: catName, _les: {}, lessons: [] });
        }
        var cat = cats[catIndex[catName]];

        // find or create the lesson within the category
        if (!cat._les.hasOwnProperty(lesName)) {
            cat._les[lesName] = cat.lessons.length;
            // type badge comes from the first (lowest-order) record in the group
            cat.lessons.push({ title: lesName, type: gr.getValue('u_type') || '', topics: [] });
        }
        var les = cat.lessons[cat._les[lesName]];

        // each record contributes one chapter
        les.topics.push({
            title:       gr.getValue('u_topics') || '',
            description: gr.getValue('u_short_description') || ''
        });
    }

    // finalize: add display numbers and drop the internal lookup helper
    var out = [];
    for (var i = 0; i < cats.length; i++) {
        var c = cats[i];
        var lessonsOut = [];
        for (var j = 0; j < c.lessons.length; j++) {
            var l = c.lessons[j];
            lessonsOut.push({
                number: (i + 1) + '.' + (j + 1),
                title:  l.title,
                type:   l.type,
                topics: l.topics
            });
        }
        out.push({
            number:  (i + 1 < 10 ? '0' : '') + (i + 1),
            title:   c.title,
            lessons: lessonsOut
        });
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: out }));

})(request, response);
