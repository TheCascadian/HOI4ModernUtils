import { Disposable, Subscriber, toDisposable } from "./event";
import { feLocalize } from "./i18n";
import { Checkbox } from "./checkbox";
import { BehaviorSubject, fromEvent, Observable, Subject, Subscription } from 'rxjs';
import { calculateDropdownMenuPlacement } from './dropdownposition';

const dropdowns: Dropdown[] = [];
export const numDropDownOpened$ = new BehaviorSubject<number>(0);

export function enableDropdowns() {
    dropdowns.forEach(s => s.dispose());
    dropdowns.length = 0;

    const selects = document.querySelectorAll('.select-container > select');
    for (let i = 0; i < selects.length; i++) {
        const select = selects[i] as HTMLSelectElement;
        dropdowns.push(new Dropdown(select));
    }
}

class Dropdown extends Subscriber {
    private closeDropdown: (() => void) | undefined = undefined;

    constructor(readonly select: HTMLSelectElement) {
        super();
        this.init();
    }

    private init() {
        this.select.setAttribute('aria-haspopup', 'listbox');
        this.select.setAttribute('aria-expanded', 'false');
        this.addSubscription(fromEvent<MouseEvent>(this.select, 'mousedown').subscribe(e => {
            e.preventDefault();
            this.select.focus();
            if (this.closeDropdown) {
                this.closeDropdown();
            } else {
                this.showSelectionsForDropdown();
            }
        }));
        this.addSubscription(fromEvent<KeyboardEvent>(this.select, 'keydown').subscribe(e => {
            if (e.code === 'Enter') {
                e.preventDefault();
                if (this.closeDropdown) {
                    this.closeDropdown();
                } else {
                    this.showSelectionsForDropdown();
                }
            }
        }));
    }

    private showSelectionsForDropdown() {
        this.select.classList.add('dropdown-opened');
        this.select.setAttribute('aria-expanded', 'true');
        const options = this.select.querySelectorAll('option');
        const optionForDropdownMenu: Option[] = [];
        options.forEach(option => {
            if (!option.hidden) {
                optionForDropdownMenu.push({
                    text: option.textContent ?? '',
                    value: option.value,
                    selected: option.value === this.select.value,
                });
            }
        });

        const dropdownMenu = new DropdownMenu(optionForDropdownMenu);
        const dropdownMenuSubscriptions: Disposable[] = [ dropdownMenu ];

        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.options$.subscribe(options => {
            const selectedOption = options.find(o => o.selected);
            if (selectedOption) {
                this.select.value = selectedOption.value;
                this.select.dispatchEvent(new Event('change'));
            }

            this.closeDropdown?.apply(this);
            setTimeout(() => this.select.focus(), 0);
        })));

        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.close$.subscribe(isKey => {
            if (isKey) {
                this.select.focus();
            }
            this.closeDropdown?.apply(this);
        })));

        numDropDownOpened$.next(numDropDownOpened$.value + 1);
        this.closeDropdown = () => {
            this.select.classList.remove('dropdown-opened');
            this.select.setAttribute('aria-expanded', 'false');
            dropdownMenu.hide();
            dropdownMenuSubscriptions.forEach(d => d.dispose());
            numDropDownOpened$.next(numDropDownOpened$.value - 1);
            this.closeDropdown = undefined;
        };

        dropdownMenu.show(this.select);
    }
}

export class DivDropdown extends Subscriber {
    private closeDropdown: (() => void) | undefined = undefined;

    public selectedValues$ = new BehaviorSubject<readonly string[]>([]);

    constructor(readonly select: HTMLDivElement, private multiSelection: boolean = false) {
        super();
        this.init();
        this.addSubscription(this.selectedValues$.subscribe((value) => {
            const options = this.getOptions(value);
            this.updateSelectedValue(options);
        }));
    }

    public selectAll() {
        const options = this.getOptions();
        const values: string[] = [];
        options.forEach(option => {
            option.selected = true;
            values.push(option.value);
        });

        this.selectedValues$.next(values);
    }

    public setupOptions(options: { value: string; text: string }[]) {
        const select = this.select;
        select.innerHTML = '<span class="value"></span>';
        for (const { value, text } of options) {
            const option = document.createElement('div');
            option.classList.add('option');
            option.setAttribute('value', value);
            option.textContent = text;
            select.appendChild(option);
        }
    }

    private init() {
        this.select.setAttribute('role', 'combobox');
        this.select.setAttribute('aria-haspopup', 'listbox');
        this.select.setAttribute('aria-expanded', 'false');
        this.addSubscription(fromEvent<MouseEvent>(this.select, 'mousedown').subscribe(e => {
            e.preventDefault();
            this.select.focus();
            if (this.closeDropdown) {
                this.closeDropdown();
            } else {
                this.showSelectionsForDropdown();
            }
        }));

        this.addSubscription(fromEvent<KeyboardEvent>(this.select, 'keydown').subscribe(e => {
            if (e.code === 'Enter' || e.code === 'Space' || e.code === 'ArrowDown') {
                e.preventDefault();
                if (this.closeDropdown) {
                    this.closeDropdown();
                } else {
                    this.showSelectionsForDropdown();
                }
            }
        }));

        const options = this.getOptions();
        this.updateSelectedValue(options);
    }

    private showSelectionsForDropdown() {
        this.select.classList.add('dropdown-opened');
        this.select.setAttribute('aria-expanded', 'true');

        const dropdownMenu = new DropdownMenu(this.getOptions(), this.multiSelection);
        const dropdownMenuSubscriptions: Disposable[] = [ dropdownMenu ];

        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.options$.subscribe(options => {
            this.updateSelectedValue(options);
            this.selectedValues$.next(options.filter(o => o.selected).map(o => o.value));
            if (!this.multiSelection) {
                this.closeDropdown?.apply(this);
                setTimeout(() => this.select.focus(), 0);
            }
        })));

        dropdownMenuSubscriptions.push(toDisposable(dropdownMenu.close$.subscribe(isKey => {
            if (isKey) {
                this.select.focus();
            }
            this.closeDropdown?.apply(this);
        })));

        numDropDownOpened$.next(numDropDownOpened$.value + 1);
        this.closeDropdown = () => {
            this.select.classList.remove('dropdown-opened');
            this.select.setAttribute('aria-expanded', 'false');
            dropdownMenu.hide();
            dropdownMenuSubscriptions.forEach(d => d.dispose());
            numDropDownOpened$.next(numDropDownOpened$.value - 1);
            this.closeDropdown = undefined;
        };

        dropdownMenu.show(this.select);
    }

    private getOptions(selectedValues?: readonly string[]): Option[] {
        if (selectedValues === undefined) {
            selectedValues = this.selectedValues$.value;
        }

        const options = this.select.querySelectorAll('.option');
        const optionForDropdownMenu: Option[] = [];
        options.forEach(option => {
            if (!option.hasAttribute('hidden')) {
                const value = option.getAttribute('value');
                optionForDropdownMenu.push({
                    text: option.textContent ?? '',
                    value: value ?? '',
                    selected: value !== null ? selectedValues!.includes(value) : false,
                });
            }
        });

        return optionForDropdownMenu;
    }

    private updateSelectedValue(options: Option[]) {
        const selectedOptions = options.filter(o => o.selected);
        const valueSpan = this.select.querySelector('span.value') as HTMLSpanElement;
        valueSpan.textContent = selectedOptions.length === 0 ? feLocalize('combobox.noselection', '(No selection)') :
            selectedOptions.length === options.length ? feLocalize('combobox.all', '(All)') :
            selectedOptions.length > 1 ? feLocalize('combobox.multiple', '{0} (+{1})', selectedOptions[0].text, selectedOptions.length - 1) :
            selectedOptions[0].text;
    }
}

type Option = { text: string, value: string, selected: boolean };
class DropdownMenu extends Subscriber {
    private writableOptions$: Subject<Option[]>;
    public options$: Observable<Option[]>;
    
    private writableClose$: Subject<boolean>;
    public close$: Observable<boolean>;

    private list: HTMLUListElement;
    private items: HTMLLIElement[] = [];
    private subscriptionWhenOpen: Subscription[] = [];
    private observersWhenOpen: Array<{ disconnect(): void }> = [];
    private positionFrame: number | undefined;

    constructor(private options: Option[], private multiSelection: boolean = false) {
        super();
        this.list = this.createList();
        this.writableOptions$ = new Subject();
        this.options$ = this.writableOptions$;
        this.writableClose$ = new Subject();
        this.close$ = this.writableClose$;

        this.addSubscription({
            dispose: () => {
                this.list.remove();
            }
        });
    }

    public show(host: Element) {
        this.hide();
        document.body.appendChild(this.list);
        this.position(host);
        this.registerEventHandlerWhenOpen(host);

        const selectedOptionIndex = this.multiSelection ? 0 : Math.max(0, this.options.findIndex(o => o.selected));
        if (this.items.length > 0) {
            this.items[selectedOptionIndex].focus();
        }
    }

    public hide() {
        this.list.parentElement?.removeChild(this.list);
        this.subscriptionWhenOpen.forEach(s => s.unsubscribe());
        this.subscriptionWhenOpen.length = 0;
        this.observersWhenOpen.forEach(observer => observer.disconnect());
        this.observersWhenOpen.length = 0;
        if (this.positionFrame !== undefined) {
            cancelAnimationFrame(this.positionFrame);
            this.positionFrame = undefined;
        }
    }

    private position(host: Element) {
        const bbox = host.getBoundingClientRect();
        const placement = calculateDropdownMenuPlacement(
            bbox,
            this.list.offsetHeight,
            window.innerWidth,
            window.innerHeight,
        );
        this.list.style.left = `${placement.left}px`;
        this.list.style.top = `${placement.top}px`;
        this.list.style.width = `${placement.width}px`;
    }

    private createList(): HTMLUListElement {
        const options = this.options;
        const list = document.createElement('ul');
        list.classList.add('select-dropdown');
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-multiselectable', String(this.multiSelection));

        const items = this.items;
    
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const item = this.createDropdownItem(option, i, items);
            list.appendChild(item);
        }

        return list;
    }

    private createDropdownItem(option: Option, index: number, items: HTMLLIElement[]): HTMLLIElement {
        const item = document.createElement('li');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(option.selected));
        item.tabIndex = -1;

        if (this.multiSelection) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = option.selected;

            item.appendChild(checkbox);
            const checkboxItem = new Checkbox(checkbox, option.text);
            this.addSubscription(checkboxItem);

            fromEvent(checkbox, 'change').subscribe(() => {
                option.selected = checkbox.checked;
                item.setAttribute('aria-selected', String(option.selected));
                this.writableOptions$.next(this.options);
            });

            fromEvent<MouseEvent>(item, 'click').subscribe((e) => {
                if (e.target === item) {
                    checkbox.click();
                }
            });

            fromEvent<KeyboardEvent>(item, 'keydown').subscribe((e) => {
                if (e.target === item && (e.code === 'Enter' || e.code === 'Space')) {
                    e.preventDefault();
                    checkbox.click();
                }
            });

        } else {
            item.textContent = option.text;
            const updateValue = () => {
                this.options.forEach(o => o.selected = false);
                option.selected = true;
                items.forEach((candidate, candidateIndex) => {
                    candidate.setAttribute('aria-selected', String(candidateIndex === index));
                });
                this.writableOptions$.next(this.options);
            };

            fromEvent(item, 'click').subscribe(updateValue);

            fromEvent<KeyboardEvent>(item, 'keydown').subscribe((e) => {
                if (e.code === 'Enter') {
                    e.preventDefault();
                    updateValue();
                }
            });
        }

        fromEvent(item, 'mouseenter').subscribe(() => {
            item.focus();
        });

        fromEvent<KeyboardEvent>(item, 'keydown').subscribe((e) => {
            if (e.code === 'ArrowDown' && index < items.length - 1) {
                e.preventDefault();
                items[index + 1].focus();
            } else if (e.code === 'ArrowUp' && index > 0) {
                e.preventDefault();
                items[index - 1].focus();
            }
        });

        items.push(item);

        return item;
    }

    private registerEventHandlerWhenOpen(host: Element) {
        const closeDropdown = (escapeKey: boolean = false) => {
            this.writableClose$.next(escapeKey);
            this.hide();
        };

        this.subscriptionWhenOpen.push(fromEvent(window, 'blur').subscribe(() => {
            closeDropdown();
        }));

        this.subscriptionWhenOpen.push(fromEvent<MouseEvent>(window, 'focusin').subscribe((e) => {
            if (!(this.list.contains(e.target as any) || host.contains(e.target as any))) {
                closeDropdown();
            }
        }));

        this.subscriptionWhenOpen.push(fromEvent<MouseEvent>(window, 'mousedown').subscribe((e) => {
            if (!(this.list.contains(e.target as any) || host.contains(e.target as any))) {
                closeDropdown();
            }
        }));

        this.subscriptionWhenOpen.push(fromEvent<KeyboardEvent>(window, 'keydown').subscribe((e) => {
            if (e.code === 'Escape') {
                closeDropdown(true);
            }
        }));

        const schedulePosition = () => {
            if (this.positionFrame !== undefined) {
                cancelAnimationFrame(this.positionFrame);
            }
            this.positionFrame = requestAnimationFrame(() => {
                this.positionFrame = undefined;
                if (this.list.isConnected && host.isConnected) {
                    this.position(host);
                }
            });
        };
        this.subscriptionWhenOpen.push(fromEvent(window, 'resize').subscribe(schedulePosition));
        this.subscriptionWhenOpen.push(fromEvent(window, 'scroll', { capture: true }).subscribe(schedulePosition));

        const hostResizeObserver = new ResizeObserver(schedulePosition);
        hostResizeObserver.observe(host);
        this.observersWhenOpen.push(hostResizeObserver);

        const hostMoveObserver = new MutationObserver(schedulePosition);
        hostMoveObserver.observe(document.body, { childList: true, subtree: true });
        this.observersWhenOpen.push(hostMoveObserver);
    }
}
