/* =============================================================================
 * Scripted REST API resource — GET a single course image (binary)
 * =============================================================================
 * Streams ONE course's image so the page can use it directly in an <img> tag:
 *     <img src="/api/x_palni_servicen_1/team_profiles/course_image/{sys_id}">
 *
 * Why this exists: the "Get Courses" list must NOT base64-inline every image —
 * with many courses that exceeds ServiceNow's 32 MB response-string limit and
 * the whole call fails (HTTP 500). Serving one image per request keeps each
 * response tiny.
 *
 * Image lookup (same idea as trainer photos):
 *   1. first IMAGE attachment on the course record, else
 *   2. the attachment behind the u_course_image (db_image) field.
 *
 * DEPLOYED AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Course Image
 *   HTTP method       : GET
 *   Relative path     : /course_image/{id}
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/course_image/{sys_id}
 *
 * REQUIRED OPERATION SETTINGS (all OFF for anonymous public access):
 *        Requires authentication      : OFF
 *        Requires ACL authorization   : OFF
 *        Requires snc_internal role   : OFF
 *
 * CORS: <img> tags load cross-origin without CORS, so no rule change is needed.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var COURSES = 'x_palni_servicen_1_course_offerings';
    var recId = request.pathParams.id;

    function imageAttachmentFor(tableSysId) {
        if (!tableSysId) return null;
        var att = new GlideRecord('sys_attachment');
        att.addQuery('table_sys_id', tableSysId);
        att.addQuery('content_type', 'STARTSWITH', 'image');
        att.orderByDesc('sys_created_on');
        att.setLimit(1);
        att.query();
        return att.next() ? att : null;
    }

    // 1) image attached to the course record
    var att = imageAttachmentFor(recId);

    // 2) fallback: db_image referenced by u_course_image
    if (!att) {
        var c = new GlideRecord(COURSES);
        if (c.get(recId)) att = imageAttachmentFor(c.getValue('u_course_image'));
    }

    if (att) {
        var ct = att.getValue('content_type') || 'image/png';
        response.setHeader('Content-Type', ct);
        response.setHeader('Cache-Control', 'public, max-age=86400');
        var stream = new GlideSysAttachment().getContentStream(att.getUniqueValue());
        response.getStreamWriter().writeStream(stream);
        return;
    }

    response.setStatus(404);
})(request, response);
