/**
* Router
*
* @public
* @class
*/
export class Router {
    /**
    * Router Array
    *
    * @protected
    * @type {Route[]}
    */
    routes = [];
    /**
    * Global Handlers
    *
    * @protected
    * @type {RouterHandler[]}
    */
    globalHandlers = [];
    /**
    * Debug Mode
    *
    * @protected
    * @type {boolean}
    */
    debugMode = false;
    /**
    * CORS Config
    *
    * @protected
    * @type {RouterCorsConfig}
    */
    corsConfig = {};
    /**
    * CORS enabled
    *
    * @protected
    * @type {boolean}
    */
    corsEnabled = false;
    /**
    * Register global handlers
    *
    * @param {RouterHandler[]} handlers
    * @returns {Router}
    */
    use(...handlers) {
        for (let handler of handlers) {
            this.globalHandlers.push(handler);
        }
        return this;
    }
    /**
    * Register CONNECT route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    connect(url, ...handlers) {
        return this.register('CONNECT', url, handlers);
    }
    /**
    * Register DELETE route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    delete(url, ...handlers) {
        return this.register('DELETE', url, handlers);
    }
    /**
    * Register GET route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    get(url, ...handlers) {
        return this.register('GET', url, handlers);
    }
    /**
    * Register HEAD route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    head(url, ...handlers) {
        return this.register('HEAD', url, handlers);
    }
    /**
    * Register OPTIONS route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    options(url, ...handlers) {
        return this.register('OPTIONS', url, handlers);
    }
    /**
    * Register PATCH route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    patch(url, ...handlers) {
        return this.register('PATCH', url, handlers);
    }
    /**
    * Register POST route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    post(url, ...handlers) {
        return this.register('POST', url, handlers);
    }
    /**
    * Register PUT route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    put(url, ...handlers) {
        return this.register('PUT', url, handlers);
    }
    /**
    * Register TRACE route
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    trace(url, ...handlers) {
        return this.register('TRACE', url, handlers);
    }
    /**
    * Register route, ignoring method
    *
    * @param {string} url
    * @param  {RouterHandler[]} handlers
    * @returns {Router}
    */
    any(url, ...handlers) {
        return this.register('*', url, handlers);
    }
    /**
    * Debug Mode
    *
    * @param {boolean} [state=true] Whether to turn on or off debug mode (default: true)
    * @returns {Router}
    */
    debug(state = true) {
        this.debugMode = state;
        return this;
    }
    /**
    * Enable CORS support
    *
    * @param {RouterCorsConfig} [config]
    * @returns {Router}
    */
    cors(config) {
        this.corsEnabled = true;
        this.corsConfig = {
            allowOrigin: config?.allowOrigin ?? '*',
            allowMethods: config?.allowMethods ?? '*',
            allowHeaders: config?.allowHeaders ?? '*',
            allowCredentials: config?.allowCredentials ?? undefined,
            vary: config?.vary ?? undefined,
            maxAge: config?.maxAge ?? 86400,
            optionsSuccessStatus: config?.optionsSuccessStatus ?? 204
        };
        return this;
    }
    setCorsHeaders(headers = new Headers()) {
        if (this.corsConfig.allowOrigin && !headers.has('Access-Control-Allow-Origin'))
            headers.set('Access-Control-Allow-Origin', this.corsConfig.allowOrigin);
        if (this.corsConfig.allowMethods && !headers.has('Access-Control-Allow-Methods'))
            headers.set('Access-Control-Allow-Methods', this.corsConfig.allowMethods);
        if (this.corsConfig.allowHeaders && !headers.has('Access-Control-Allow-Headers'))
            headers.set('Access-Control-Allow-Headers', this.corsConfig.allowHeaders);
        if (this.corsConfig.allowCredentials && !headers.has('Access-Control-Allow-Credentials'))
            headers.set('Access-Control-Allow-Credentials', this.corsConfig.allowCredentials.toString());
        if (this.corsConfig.vary && !headers.has('vary'))
            headers.set('vary', this.corsConfig.vary.toString());
        if (this.corsConfig.maxAge && !headers.has('Access-Control-Max-Age'))
            headers.set('Access-Control-Max-Age', this.corsConfig.maxAge.toString());
        return headers;
    }
    /**
    * Register route
    *
    * @private
    * @param {string} method HTTP request method
    * @param {string} url URL String
    * @param {RouterHandler[]} handlers Arrar of handler functions
    * @returns {Router}
    */
    register(method, url, handlers) {
        this.routes.push({
            method,
            url,
            handlers
        });
        return this;
    }
    /**
    * Get Route by request
    *
    * @private
    * @param {RouterRequest} request
    * @returns {Route | undefined}
    */
    getRoute(request) {
        const url = new URL(request.url);
        const pathArr = url.pathname.split('/').filter(i => i);
        return this.routes.find(r => {
            const routeArr = r.url.split('/').filter(i => i);
            if (![request.method, '*'].includes(r.method) || routeArr.length !== pathArr.length)
                return false;
            const params = {};
            for (let i = 0; i < routeArr.length; i++) {
                if (routeArr[i] !== pathArr[i] && routeArr[i][0] !== ':')
                    return false;
                if (routeArr[i][0] === ':')
                    params[routeArr[i].substring(1)] = pathArr[i];
            }
            request.params = params;
            const query = {};
            for (const [k, v] of url.searchParams.entries()) {
                query[k] = v;
            }
            request.query = query;
            return true;
        }) || this.routes.find(r => r.url === '*' && [request.method, '*'].includes(r.method));
    }
    /**
    * Handle requests
    *
    * @param {Request} request
    * @param {Env} env
    * @param {CtxExt} [ctxExt]
    * @param {ReqExt} [reqExt]
    * @returns {Promise<Response>}
    */
    async handle(request, env, ctx, ctxExt, reqExt) {
        const buffer = {};
        const req = {
            ...(reqExt ?? {}),
            method: request.method,
            headers: request.headers,
            url: request.url,
            cf: request.cf,
            raw: request,
            params: {},
            query: {},
            arrayBuffer: async () => buffer.arrayBuffer ? buffer.arrayBuffer : buffer.arrayBuffer = await request.clone().arrayBuffer(),
            text: async () => buffer.text ? buffer.text : buffer.text = await request.clone().text(),
            json: async () => buffer.json ? buffer.json : buffer.json = await request.clone().json(),
            formData: async () => buffer.formData ? buffer.formData : buffer.formData = await request.clone().formData(),
            blob: async () => buffer.blob ? buffer.blob : buffer.blob = await request.clone().blob(),
            bearer: () => request.headers.get('Authorization')?.replace(/^(B|b)earer /, '').trim()
        };
        if (this.corsEnabled && req.method === 'OPTIONS') {
            return new Response(null, {
                headers: this.setCorsHeaders(),
                status: this.corsConfig.optionsSuccessStatus
            });
        }
        const route = this.getRoute(req);
        if (!route)
            return new Response(this.debugMode ? 'Route not found!' : null, { status: 404 });
        const handlers = [...this.globalHandlers, ...route.handlers];
        const dbg = this.debugMode;
        let response;
        for (const handler of handlers) {
            const context = {
                ...(ctxExt ?? {}),
                env,
                req,
                dbg,
                ctx
            };
            const res = await handler(context);
            if (res) {
                response = res;
                break;
            }
        }
        if (!response)
            return new Response(this.debugMode ? 'Handler did not return a Response!' : null, { status: 404 });
        if (this.corsEnabled) {
            response = new Response(response.body, response);
            this.setCorsHeaders(response.headers);
        }
        return response;
    }
}
