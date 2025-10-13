import { type NavItem } from '@/types';

export function isNavItemAccessible(
    item: NavItem,
    abilityMap: Record<string, boolean>,
): boolean {
    if (!item.requiredAbility) {
        return true;
    }

    return abilityMap[item.requiredAbility] === true;
}

export function filterNavItems(
    items: NavItem[],
    abilityMap: Record<string, boolean>,
): NavItem[] {
    return items.filter((item) => isNavItemAccessible(item, abilityMap));
}
