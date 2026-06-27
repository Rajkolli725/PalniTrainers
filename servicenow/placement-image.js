/* =============================================================================
 * Scripted REST API resource — GET a single placement logo (binary stream)
 * =============================================================================
 * OPTIONAL. Only needed if you prefer NOT to embed base64 logos in
 * get_placements. The web page automatically falls back to this endpoint
 * (placement_image/{sys_id}) when a record has no embedded data URI.
 *
 * DEPLOY AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Placement Image
 *   HTTP method       : GET
 *   Relative path     : /placement_image/{sys_id}
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/placement_image/{sys_id}
 *
 * Settings: Requires authentication / ACL / snc_internal  -> all OFF.
 * Mirrors the existing course_image resource.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id || '';
    if (!/^[a-f0-9]{32}$/i.test(sysId)) {
        response.setStatus(400);
        response.setHeader('Content-Type', 'application/json');
        response.getStreamWriter().writeString(JSON.stringify({ error: 'bad sys_id' }));
        return;
    }

    // Find the image attachment on this placement record.
    var a = new GlideRecord('sys_attachment');
    a.addQuery('table_sys_id', sysId);
    a.orderByDesc('sys_created_on');
    a.query();

    var pick = null, ct = 'image/png';
    while (a.next()) {
        var c = ('' + a.getValue('content_type')).toLowerCase();
        var fn = ('' + a.getValue('file_name')).toLowerCase();
        if (c.indexOf('image') === 0 || /\.(png|jpe?g|gif|svg|webp)$/.test(fn) || fn.indexOf('profile_picture') > -1) {
            pick = a.getUniqueValue();
            ct = a.getValue('content_type') || ct;
            break;
        }
    }

    if (!pick) {
        response.setStatus(404);
        response.setHeader('Content-Type', 'application/json');
        response.getStreamWriter().writeString(JSON.stringify({ error: 'no image' }));
        return;
    }

    response.setStatus(200);
    response.setHeader('Content-Type', ct);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    // Stream the attachment bytes straight to the response.
    var gsa = new GlideSysAttachment();
    response.getStreamWriter().writeStream(gsa.getContentStream(pick));

})(request, response);
