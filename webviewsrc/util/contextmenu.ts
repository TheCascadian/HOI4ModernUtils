import { fromEvent, Subscription } from 'rxjs';

export interface ContextMenuItem {
    label: string;
    tooltip?: string;
    action?: () => void;
    checked?: boolean;
    disabled?: boolean;
    submenu?: ContextMenuItem[];
}

/**
 * A context menu with optional nested submenus and checkbox-style items.
 * It supports mouse and keyboard invocation and restores focus when closed.
 */
export class ContextMenu {
    private root: HTMLUListElement | undefined;
    private submenus: HTMLUListElement[] = [];
    private openSubscriptions: Subscription[] = [];
    private previousFocus: HTMLElement | undefined;

    public show(x: number, y: number, items: ContextMenuItem[]): void {
        this.hide();
        this.previousFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : undefined;

        const list = this.buildList(items, 0);
        document.body.appendChild(list);
        this.root = list;
        this.position(list, x, y);
        this.registerCloseHandlers();
        this.focusFirstEnabled(list);
    }

    public hide(): void {
        const focusTarget = this.previousFocus;
        this.submenus.forEach(menu => menu.remove());
        this.submenus = [];
        this.root?.remove();
        this.root = undefined;
        this.openSubscriptions.forEach(subscription => subscription.unsubscribe());
        this.openSubscriptions = [];
        this.previousFocus = undefined;
        focusTarget?.focus();
    }

    public dispose(): void {
        this.hide();
    }

    private buildList(items: ContextMenuItem[], depth: number): HTMLUListElement {
        const list = document.createElement('ul');
        list.classList.add('context-menu');
        list.setAttribute('role', 'menu');

        for (const item of items) {
            const li = document.createElement('li');
            li.classList.add('context-menu-item');
            li.tabIndex = -1;
            li.setAttribute('role', item.checked === undefined ? 'menuitem' : 'menuitemcheckbox');
            if (item.checked !== undefined) {
                li.setAttribute('aria-checked', String(item.checked));
            }
            li.setAttribute(
                'aria-label',
                item.tooltip ? `${item.label}. ${item.tooltip}` : item.label
            );
            if (item.tooltip) {
                li.title = item.tooltip;
            }
            if (item.disabled) {
                li.classList.add('disabled');
                li.setAttribute('aria-disabled', 'true');
            }

            const check = document.createElement('span');
            check.classList.add('context-menu-check');
            check.textContent = item.checked ? '\u2713' : '';
            check.setAttribute('aria-hidden', 'true');
            li.appendChild(check);

            const label = document.createElement('span');
            label.classList.add('context-menu-label');
            label.textContent = item.label;
            li.appendChild(label);

            if (item.submenu && item.submenu.length > 0) {
                li.classList.add('has-submenu');
                li.setAttribute('aria-haspopup', 'menu');

                const arrow = document.createElement('span');
                arrow.classList.add('context-menu-arrow');
                arrow.textContent = '\u25B8';
                arrow.setAttribute('aria-hidden', 'true');
                li.appendChild(arrow);

                li.addEventListener('mouseenter', () => {
                    this.closeSubmenusFrom(depth);
                    if (item.disabled) {
                        return;
                    }

                    const submenu = this.buildList(item.submenu!, depth + 1);
                    document.body.appendChild(submenu);
                    this.submenus[depth] = submenu;

                    const bbox = li.getBoundingClientRect();
                    this.position(submenu, bbox.right, bbox.top);
                });

                if (!item.disabled && item.action) {
                    li.addEventListener('click', event => {
                        event.stopPropagation();
                        item.action!();
                        this.hide();
                    });
                }
            } else {
                li.addEventListener('mouseenter', () => {
                    this.closeSubmenusFrom(depth);
                });

                if (!item.disabled && item.action) {
                    li.addEventListener('click', event => {
                        event.stopPropagation();
                        item.action!();
                        this.hide();
                    });
                }
            }

            list.appendChild(li);
        }

        list.addEventListener('keydown', event => {
            const item = event.target as HTMLLIElement;
            if (!item.classList.contains('context-menu-item')) {
                return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                this.moveFocus(list, item, event.key === 'ArrowDown' ? 1 : -1);
            } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                this.focusBoundary(list, event.key === 'Home');
            } else if ((event.key === 'Enter' || event.key === ' ') && item.getAttribute('aria-disabled') !== 'true') {
                event.preventDefault();
                item.click();
            } else if (event.key === 'ArrowRight' && item.getAttribute('aria-haspopup') === 'menu') {
                event.preventDefault();
                item.dispatchEvent(new MouseEvent('mouseenter'));
                const submenu = this.submenus[depth];
                if (submenu) {
                    this.focusFirstEnabled(submenu);
                }
            } else if (event.key === 'ArrowLeft' && depth > 0) {
                event.preventDefault();
                const parentMenu = depth === 1 ? this.root : this.submenus[depth - 2];
                this.closeSubmenusFrom(depth - 1);
                parentMenu?.querySelector<HTMLLIElement>('.context-menu-item[aria-haspopup="menu"]')?.focus();
            }
        });

        return list;
    }

    private enabledItems(list: HTMLUListElement): HTMLLIElement[] {
        return Array.from(list.querySelectorAll(':scope > .context-menu-item'))
            .filter((item): item is HTMLLIElement =>
                item instanceof HTMLLIElement && item.getAttribute('aria-disabled') !== 'true'
            );
    }

    private focusFirstEnabled(list: HTMLUListElement): void {
        this.enabledItems(list)[0]?.focus();
    }

    private focusBoundary(list: HTMLUListElement, first: boolean): void {
        const items = this.enabledItems(list);
        items[first ? 0 : items.length - 1]?.focus();
    }

    private moveFocus(list: HTMLUListElement, current: HTMLLIElement, delta: number): void {
        const items = this.enabledItems(list);
        if (items.length === 0) {
            return;
        }
        const currentIndex = Math.max(0, items.indexOf(current));
        items[(currentIndex + delta + items.length) % items.length].focus();
    }

    private closeSubmenusFrom(depth: number): void {
        while (this.submenus.length > depth) {
            this.submenus.pop()?.remove();
        }
    }

    private position(list: HTMLUListElement, x: number, y: number): void {
        list.style.left = x + 'px';
        list.style.top = y + 'px';

        const bbox = list.getBoundingClientRect();
        if (bbox.right > window.innerWidth) {
            list.style.left = Math.max(0, window.innerWidth - bbox.width) + 'px';
        }
        if (bbox.bottom > window.innerHeight) {
            list.style.top = Math.max(0, window.innerHeight - bbox.height) + 'px';
        }
    }

    private registerCloseHandlers(): void {
        const close = () => this.hide();

        this.openSubscriptions.push(fromEvent(window, 'blur').subscribe(close));

        this.openSubscriptions.push(fromEvent<MouseEvent>(window, 'mousedown').subscribe(event => {
            const target = event.target as Node;
            if (this.root?.contains(target) || this.submenus.some(menu => menu.contains(target))) {
                return;
            }
            close();
        }));

        this.openSubscriptions.push(fromEvent<KeyboardEvent>(window, 'keydown').subscribe(event => {
            if (event.code === 'Escape') {
                close();
            }
        }));

        this.openSubscriptions.push(fromEvent(window, 'scroll', { capture: true }).subscribe(close));
    }
}
