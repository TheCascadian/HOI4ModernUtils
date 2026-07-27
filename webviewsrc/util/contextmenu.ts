import { fromEvent, Subscription } from 'rxjs';

export interface ContextMenuItem {
    label: string;
    action?: () => void;
    checked?: boolean;
    disabled?: boolean;
    submenu?: ContextMenuItem[];
}

/**
 * A mouse-anchored context menu with optional nested submenus and checkbox-style items.
 * Any item (leaf or checkbox) closes the entire menu tree when clicked.
 */
export class ContextMenu {
    private root: HTMLUListElement | undefined;
    private submenus: HTMLUListElement[] = [];
    private openSubscriptions: Subscription[] = [];

    public show(x: number, y: number, items: ContextMenuItem[]): void {
        this.hide();

        const list = this.buildList(items, 0);
        document.body.appendChild(list);
        this.root = list;
        this.position(list, x, y);
        this.registerCloseHandlers();
    }

    public hide(): void {
        this.submenus.forEach(m => m.remove());
        this.submenus = [];
        this.root?.remove();
        this.root = undefined;
        this.openSubscriptions.forEach(s => s.unsubscribe());
        this.openSubscriptions = [];
    }

    public dispose(): void {
        this.hide();
    }

    private buildList(items: ContextMenuItem[], depth: number): HTMLUListElement {
        const list = document.createElement('ul');
        list.classList.add('context-menu');

        for (const item of items) {
            const li = document.createElement('li');
            li.classList.add('context-menu-item');
            li.tabIndex = -1;
            if (item.disabled) {
                li.classList.add('disabled');
            }

            const check = document.createElement('span');
            check.classList.add('context-menu-check');
            check.textContent = item.checked ? '✓' : '';
            li.appendChild(check);

            const label = document.createElement('span');
            label.classList.add('context-menu-label');
            label.textContent = item.label;
            li.appendChild(label);

            if (item.submenu && item.submenu.length > 0) {
                li.classList.add('has-submenu');

                const arrow = document.createElement('span');
                arrow.classList.add('context-menu-arrow');
                arrow.textContent = '▸';
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
                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.action!();
                        this.hide();
                    });
                }
            } else {
                li.addEventListener('mouseenter', () => {
                    this.closeSubmenusFrom(depth);
                });

                if (!item.disabled && item.action) {
                    li.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.action!();
                        this.hide();
                    });
                }
            }

            list.appendChild(li);
        }

        return list;
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

        this.openSubscriptions.push(fromEvent<MouseEvent>(window, 'mousedown').subscribe((e) => {
            const target = e.target as Node;
            if (this.root?.contains(target)) {
                return;
            }
            if (this.submenus.some(m => m.contains(target))) {
                return;
            }
            close();
        }));

        this.openSubscriptions.push(fromEvent<KeyboardEvent>(window, 'keydown').subscribe((e) => {
            if (e.code === 'Escape') {
                close();
            }
        }));

        this.openSubscriptions.push(fromEvent(window, 'scroll', { capture: true }).subscribe(close));
    }
}
