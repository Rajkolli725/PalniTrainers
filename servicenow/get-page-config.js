/* =============================================================================
 * Scripted REST API resource — GET page configuration
 * =============================================================================
 * Returns editable page content from the page-configuration table so the
 * website can pull rich (HTML) content and stat values that don't fit — or
 * are easier to maintain — outside of system properties. Anonymous + read-only;
 * no credentials.
 *
 *     Table : x_palni_servicen_1_page_configurations
 *
 * RECORD SELECTED:
 *   Only rows with u_active = true are considered. If more than one is active,
 *   the MOST RECENTLY UPDATED row wins (orderByDesc sys_updated_on).
 *
 * Returned keys (each falls back to '' when the field is empty):
 *     enterprise      <- u_enterprise                       (HTML — Enterprise section body)
 *     heroSubtext     <- u_hero_section_subtext             (HTML — hero subtext)
 *     pros            <- u_professionals_trained_and_placed (hero trust line + stats band)
 *     trainers        <- u_expert_consultants_and_trainers  (stats band — trainers count)
 *     success         <- u_project_success_rate             (stats band — success rate)
 *     rating          <- u_average_client_rating            (stats band — client rating)
 *     trainersSubtext <- u_trainers_subtext                 (HTML — trainers page + home preview subtext)
 *     coursesSubtext  <- u_courses_subtext                  (HTML — courses page + home preview subtext)
 *     servicesSubtext <- u_services_subtext                 (HTML — services mega-menu subtext)
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
 * ⚠️ The HTML fields are rendered as HTML on the site — only trusted admins
 *    should edit them.
 *
 * CORS: added under the existing "Team Profiles" REST API, so the existing
 *       "TeamProfile" CORS rule already covers it (domain + GET). No change.
 * ===========================================================================*/
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var TABLE = 'x_palni_servicen_1_page_configurations';

    var cfg = {
        enterprise: '',
        heroSubtext: '',
        pros: '',
        trainers: '',
        success: '',
        rating: '',
        trainersSubtext: '',
        coursesSubtext: '',
        servicesSubtext: ''
    };

    var gr = new GlideRecord(TABLE);
    gr.addQuery('u_active', true);
    gr.orderByDesc('sys_updated_on');   // most recently updated active row wins
    gr.setLimit(1);
    gr.query();
    if (gr.next()) {
        cfg.enterprise      = gr.getValue('u_enterprise') || '';
        cfg.heroSubtext     = gr.getValue('u_hero_section_subtext') || '';
        cfg.pros            = gr.getValue('u_professionals_trained_and_placed') || '';
        cfg.trainers        = gr.getValue('u_expert_consultants_and_trainers') || '';
        cfg.success         = gr.getValue('u_project_success_rate') || '';
        cfg.rating          = gr.getValue('u_average_client_rating') || '';
        cfg.trainersSubtext = gr.getValue('u_trainers_subtext') || '';
        cfg.coursesSubtext  = gr.getValue('u_courses_subtext') || '';
        cfg.servicesSubtext = gr.getValue('u_services_subtext') || '';
    }

    response.setStatus(200);
    response.setHeader('Content-Type', 'application/json');
    response.getStreamWriter().writeString(JSON.stringify({ result: cfg }));

})(request, response);
