import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
export const document = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: document.url(args, options),
    method: 'get',
})

document.definition = {
    methods: ["get","head"],
    url: '/api/leave-requests/{leaveRequest}/document',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
document.url = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leaveRequest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leaveRequest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leaveRequest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leaveRequest: typeof args.leaveRequest === 'object'
                ? args.leaveRequest.id
                : args.leaveRequest,
                }

    return document.definition.url
            .replace('{leaveRequest}', parsedArgs.leaveRequest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
document.get = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: document.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
document.head = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: document.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
    const documentForm = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: document.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
        documentForm.get = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: document.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Leave\LeaveRequestDocumentController::document
 * @see app/Http/Controllers/Leave/LeaveRequestDocumentController.php:17
 * @route '/api/leave-requests/{leaveRequest}/document'
 */
        documentForm.head = (args: { leaveRequest: number | { id: number } } | [leaveRequest: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: document.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    document.form = documentForm
const leaveRequests = {
    document: Object.assign(document, document),
}

export default leaveRequests