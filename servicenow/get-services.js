/* =============================================================================
 * Scripted REST API resource — GET services
 * =============================================================================
 * Returns the active rows of x_palni_servicen_1_services so the website's
 * "Services" mega-menu can render one card per record. Anonymous + read-only;
 * no credentials.
 *
 *     Table : x_palni_servicen_1_services
 *
 * Each item in the returned array:
 *     sys_id        <- record sys_id
 *     title         <- u_service_title
 *     description   <- u_service_description
 *     highlights    <- u_highlights          (comma-separated; page splits into pills)
 *     button_text   <- u_button_text
 *     order         <- u_order
 *     icon          <- u_icon image as a data: URI (base64), or '' if none
 *
 * Only rows with u_active = true are returned, ordered by u_order.
 *
 * DEPLOYED AS:
 *   Scripted REST API : Team Profiles  (x_palni_servicen_1 scope)
 *   Operation         : Get Services
 *   HTTP method       : GET
 *   Relative path     : /get_services
 *   Full URL          : /api/x_palni_servicen_1/team_profiles/get_services
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

    var TABLE = 'x_palni_servicen_1_services';
    var ga = new GlideSysAttachment();
    var out = [];

    var gr = new GlideRecord(TABLE);
    gr.addQuery('u_active', true);
    gr.orderBy('u_order');
    gr.query();
    while (gr.next()) {
        var sysId = gr.getUniqueValue();

        // The u_icon image is stored as an attachment on the record. Scoped-table
        // attachments carry a ZZ_YY-prefixed table_name, so query by table_sys_id.
        var icon = '';
        var att = new GlideRecord('sys_attachment');
        att.addQuery('table_sys_id', sysId);
        att.query();
        while (att.next()) {
            var ct = att.getValue('content_type') || '';
            var fn = att.getValue('file_name') || '';
            if (ct.indexOf('image/') === 0 || /icon|image|photo/i.test(fn)) {
                icon = 'data:' + ct + ';base64,' + ga.getContentBase64(att);
                break;
            }
        }

        out.push({
            sys_id: sysId,
            title: gr.getValue('u_service_title'),
            description: gr.getValue('u_service_description'),
            highlights: gr.getValue('u_highlights'),
            button_text: gr.getValue('u_button_text'),
            order: gr.getValue('u_order'),
            icon: icon
        });
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: out }));

})(request, response);
