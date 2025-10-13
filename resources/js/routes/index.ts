import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../wayfinder'
/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
    const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: login.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
        loginForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: login.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:20
 * @route '/login'
 */
        loginForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: login.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    login.form = loginForm
/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:54
 * @route '/logout'
 */
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:54
 * @route '/logout'
 */
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:54
 * @route '/logout'
 */
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:54
 * @route '/logout'
 */
    const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: logout.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:54
 * @route '/logout'
 */
        logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: logout.url(options),
            method: 'post',
        })
    
    logout.form = logoutForm
/**
 * @see routes/web.php:6
 * @route '/'
 */
export const home = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

home.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:6
 * @route '/'
 */
home.url = (options?: RouteQueryOptions) => {
    return home.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:6
 * @route '/'
 */
home.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:6
 * @route '/'
 */
home.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: home.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:6
 * @route '/'
 */
    const homeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: home.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:6
 * @route '/'
 */
        homeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: home.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:6
 * @route '/'
 */
        homeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: home.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    home.form = homeForm
/**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:11
 * @route '/dashboard'
 */
        dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboard.form = dashboardForm
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
export const register = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

register.definition = {
    methods: ["get","head"],
    url: '/register',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
register.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
register.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: register.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
    const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: register.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
        registerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: register.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::register
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:21
 * @route '/register'
 */
        registerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: register.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    register.form = registerForm
/**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
export const leaveRequests = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: leaveRequests.url(options),
    method: 'get',
})

leaveRequests.definition = {
    methods: ["get","head"],
    url: '/leave/requests',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
leaveRequests.url = (options?: RouteQueryOptions) => {
    return leaveRequests.definition.url + queryParams(options)
}

/**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
leaveRequests.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: leaveRequests.url(options),
    method: 'get',
})
/**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
leaveRequests.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: leaveRequests.url(options),
    method: 'head',
})

    /**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
    const leaveRequestsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: leaveRequests.url(options),
        method: 'get',
    })

            /**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
        leaveRequestsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: leaveRequests.url(options),
            method: 'get',
        })
            /**
 * @see routes/leave.php:8
 * @route '/leave/requests'
 */
        leaveRequestsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: leaveRequests.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    leaveRequests.form = leaveRequestsForm
/**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
export const leaveRequestCreate = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: leaveRequestCreate.url(options),
    method: 'get',
})

leaveRequestCreate.definition = {
    methods: ["get","head"],
    url: '/leave/requests/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
leaveRequestCreate.url = (options?: RouteQueryOptions) => {
    return leaveRequestCreate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
leaveRequestCreate.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: leaveRequestCreate.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
leaveRequestCreate.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: leaveRequestCreate.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
    const leaveRequestCreateForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: leaveRequestCreate.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
        leaveRequestCreateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: leaveRequestCreate.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Leave\LeaveRequestPageController::leaveRequestCreate
 * @see app/Http/Controllers/Leave/LeaveRequestPageController.php:21
 * @route '/leave/requests/create'
 */
        leaveRequestCreateForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: leaveRequestCreate.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    leaveRequestCreate.form = leaveRequestCreateForm
/**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
export const leaveRequestDetail = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: leaveRequestDetail.url(args, options),
    method: 'get',
})

leaveRequestDetail.definition = {
    methods: ["get","head"],
    url: '/leave/requests/{leaveRequest}',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
leaveRequestDetail.url = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leaveRequest: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    leaveRequest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leaveRequest: args.leaveRequest,
                }

    return leaveRequestDetail.definition.url
            .replace('{leaveRequest}', parsedArgs.leaveRequest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
leaveRequestDetail.get = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: leaveRequestDetail.url(args, options),
    method: 'get',
})
/**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
leaveRequestDetail.head = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: leaveRequestDetail.url(args, options),
    method: 'head',
})

    /**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
    const leaveRequestDetailForm = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: leaveRequestDetail.url(args, options),
        method: 'get',
    })

            /**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
        leaveRequestDetailForm.get = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: leaveRequestDetail.url(args, options),
            method: 'get',
        })
            /**
 * @see routes/leave.php:15
 * @route '/leave/requests/{leaveRequest}'
 */
        leaveRequestDetailForm.head = (args: { leaveRequest: string | number } | [leaveRequest: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: leaveRequestDetail.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    leaveRequestDetail.form = leaveRequestDetailForm
/**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
export const approvalsInbox = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: approvalsInbox.url(options),
    method: 'get',
})

approvalsInbox.definition = {
    methods: ["get","head"],
    url: '/approvals/inbox',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
approvalsInbox.url = (options?: RouteQueryOptions) => {
    return approvalsInbox.definition.url + queryParams(options)
}

/**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
approvalsInbox.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: approvalsInbox.url(options),
    method: 'get',
})
/**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
approvalsInbox.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: approvalsInbox.url(options),
    method: 'head',
})

    /**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
    const approvalsInboxForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: approvalsInbox.url(options),
        method: 'get',
    })

            /**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
        approvalsInboxForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: approvalsInbox.url(options),
            method: 'get',
        })
            /**
 * @see routes/leave.php:21
 * @route '/approvals/inbox'
 */
        approvalsInboxForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: approvalsInbox.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    approvalsInbox.form = approvalsInboxForm