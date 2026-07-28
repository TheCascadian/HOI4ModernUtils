import { Renderer, WorldMapRenderStats } from './renderer';
import { TopBar } from './topbar';
import { ViewPoint } from './viewpoint';
import { getState, setState } from '../util/common';
import { nearestPerformanceOverlayCorner, PerformanceOverlayCorner } from './performancegeometry';

const validCorners = new Set<PerformanceOverlayCorner>([
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
]);

export class PerformanceDebugOverlay {
    private readonly renderTimes: number[] = [];
    private readonly renderTimestamps: number[] = [];
    private latestStats: WorldMapRenderStats | undefined;
    private corner: PerformanceOverlayCorner;
    private visible: boolean;

    constructor(
        private readonly renderer: Renderer,
        private readonly topBar: TopBar,
        private readonly viewPoint: ViewPoint,
    ) {
        const panel = document.getElementById('performance-debug-overlay') as HTMLElement | null;
        const toggle = document.getElementById('performance-debug-toggle') as HTMLInputElement | null;
        if (!panel || !toggle) {
            this.corner = 'bottom-right';
            this.visible = false;
            return;
        }

        const savedCorner = getState().performanceDebugCorner as PerformanceOverlayCorner | undefined;
        this.corner = savedCorner && validCorners.has(savedCorner) ? savedCorner : 'bottom-right';
        this.visible = getState().performanceDebugVisible === true;

        const applyVisibility = () => {
            panel.hidden = !this.visible;
            toggle.checked = this.visible;
        };
        const applyCorner = (corner: PerformanceOverlayCorner) => {
            this.corner = corner;
            panel.dataset.corner = corner;
            panel.style.left = '';
            panel.style.top = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.querySelectorAll<HTMLButtonElement>('[data-performance-corner]').forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.performanceCorner === corner));
            });
            setState({ performanceDebugCorner: corner });
        };

        applyVisibility();
        applyCorner(this.corner);

        toggle.addEventListener('change', () => {
            this.visible = toggle.checked;
            setState({ performanceDebugVisible: this.visible });
            applyVisibility();
        });

        panel.querySelector<HTMLButtonElement>('#performance-debug-close')?.addEventListener('click', () => {
            this.visible = false;
            setState({ performanceDebugVisible: false });
            applyVisibility();
        });

        panel.querySelectorAll<HTMLButtonElement>('[data-performance-corner]').forEach(button => {
            button.addEventListener('click', () => {
                const next = button.dataset.performanceCorner as PerformanceOverlayCorner;
                if (validCorners.has(next)) {
                    applyCorner(next);
                }
            });
        });

        this.enableDragging(panel, applyCorner);
        this.renderer.renderStats$.subscribe(stats => {
            if (!stats) {
                return;
            }
            this.latestStats = stats;
            this.renderTimes.push(stats.totalMs);
            if (this.renderTimes.length > 120) {
                this.renderTimes.shift();
            }
            this.renderTimestamps.push(stats.timestamp);
            this.update(panel);
        });

        window.setInterval(() => this.update(panel), 500);
    }

    private enableDragging(
        panel: HTMLElement,
        applyCorner: (corner: PerformanceOverlayCorner) => void,
    ): void {
        const handle = panel.querySelector<HTMLElement>('.performance-debug-header');
        if (!handle) {
            return;
        }
        let dragging = false;
        let pointerOffsetX = 0;
        let pointerOffsetY = 0;

        handle.addEventListener('pointerdown', event => {
            if ((event.target as HTMLElement).closest('button')) {
                return;
            }
            const bounds = panel.getBoundingClientRect();
            dragging = true;
            pointerOffsetX = event.clientX - bounds.left;
            pointerOffsetY = event.clientY - bounds.top;
            panel.dataset.dragging = 'true';
            panel.style.left = `${bounds.left}px`;
            panel.style.top = `${bounds.top}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
            handle.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        handle.addEventListener('pointermove', event => {
            if (!dragging) {
                return;
            }
            const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
            const maxTop = Math.max(76, window.innerHeight - panel.offsetHeight - 8);
            panel.style.left = `${Math.max(8, Math.min(maxLeft, event.clientX - pointerOffsetX))}px`;
            panel.style.top = `${Math.max(76, Math.min(maxTop, event.clientY - pointerOffsetY))}px`;
        });

        const finishDrag = (event: PointerEvent) => {
            if (!dragging) {
                return;
            }
            dragging = false;
            delete panel.dataset.dragging;
            const bounds = panel.getBoundingClientRect();
            applyCorner(nearestPerformanceOverlayCorner(
                bounds.left + bounds.width / 2,
                bounds.top + bounds.height / 2,
                window.innerWidth,
                window.innerHeight,
            ));
            if (handle.hasPointerCapture(event.pointerId)) {
                handle.releasePointerCapture(event.pointerId);
            }
        };
        handle.addEventListener('pointerup', finishDrag);
        handle.addEventListener('pointercancel', finishDrag);
    }

    private update(panel: HTMLElement): void {
        if (!this.visible) {
            return;
        }
        const now = performance.now();
        while (this.renderTimestamps.length > 0 && this.renderTimestamps[0] < now - 1000) {
            this.renderTimestamps.shift();
        }
        const average = this.renderTimes.length > 0
            ? this.renderTimes.reduce((sum, value) => sum + value, 0) / this.renderTimes.length
            : 0;
        const stats = this.latestStats;
        this.setMetric(panel, 'render-rate', `${this.renderTimestamps.length}/s`);
        this.setMetric(panel, 'frame-time', stats ? `${stats.totalMs.toFixed(2)} ms` : 'Waiting');
        this.setMetric(panel, 'average-time', `${average.toFixed(2)} ms`);
        this.setMetric(panel, 'map-time', stats
            ? stats.mapRedrawn ? `${stats.mapMs.toFixed(2)} ms` : 'cached'
            : 'Waiting');
        this.setMetric(panel, 'viewport', stats
            ? `${stats.canvasWidth} × ${stats.canvasHeight}`
            : `${window.innerWidth} × ${window.innerHeight}`);
        this.setMetric(panel, 'zoom', `${this.viewPoint.scale.toFixed(3)}×`);
        this.setMetric(panel, 'mode', `${this.topBar.viewMode$.value} / ${this.topBar.colorSet$.value}`);
        this.setMetric(panel, 'selection', String(this.topBar.selectedProvinceIds$.value.size));
        const optimizations = Array.from(this.topBar.renderOptimizations$.value);
        this.setMetric(panel, 'optimizations', optimizations.length > 0 ? optimizations.join(', ') : 'none');
    }

    private setMetric(panel: HTMLElement, name: string, value: string): void {
        const element = panel.querySelector<HTMLElement>(`[data-performance-metric="${name}"]`);
        if (element) {
            element.textContent = value;
        }
    }
}
