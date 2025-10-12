export type RouteHelper = string & {
    name: string;
    url: string;
    params?: Record<string, string | number>;
};

function createRoute(
    name: string,
    url: string,
    params: Record<string, string | number> = {},
): RouteHelper {
    const route = Object.assign(new String(url), {
        name,
        url,
        params,
    });

    // Ensure implicit string conversions behave as expected.
    (route as unknown as { [Symbol.toPrimitive]: () => string })[Symbol.toPrimitive] = () => url;

    return route as RouteHelper;
}

export function dashboard(): RouteHelper {
    return createRoute('dashboard', '/dashboard');
}

export function leaveRequests(): RouteHelper {
    return createRoute('leave-requests.index', '/leave/requests');
}

export function leaveRequestCreate(): RouteHelper {
    return createRoute('leave-requests.create', '/leave/requests/create');
}

export function leaveRequestDetail(id: string): RouteHelper {
    return createRoute('leave-requests.show', `/leave/requests/${id}`, { id });
}

export function approvalsInbox(): RouteHelper {
    return createRoute('approvals.inbox', '/approvals');
}

export function divisionCalendar(): RouteHelper {
    return createRoute('leave.calendar', '/leave/calendar');
}

export function policiesAndHolidays(): RouteHelper {
    return createRoute('policies.index', '/policies');
}

export function leaveBalances(): RouteHelper {
    return createRoute('leave.balances', '/balances');
}
