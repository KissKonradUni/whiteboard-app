import type { Template } from './templates';

export type WhiteboardElement = {
    id?: string;
    type: "line" | "rect" | "ellipse" | "text" | "path";
    x: number;
    y: number;
}

export type LineElement = WhiteboardElement & {
    type: "line";
    x2: number;
    y2: number;
    color: string;
    width: number;
}

export type RectElement = WhiteboardElement & {
    type: "rect";
    width: number;
    height: number;
    color: string;
}

export type EllipseElement = WhiteboardElement & {
    type: "ellipse";
    radiusX: number;
    radiusY: number;
    color: string;
}

export type TextElement = WhiteboardElement & {
    type: "text";
    text: string;
    fontSize: number;
    color: string;
}

export type PathElement = WhiteboardElement & {
    type: "path";
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

export type Tool = 'pan' | 'pen' | 'line' | 'rect' | 'ellipse' | 'eraser' | 'text';

const CURSOR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

class Whiteboard {
    private wrapperElement: HTMLDivElement;
    private canvasElement: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private canvasSize: { width: number; height: number } = { width: 0, height: 0 };
    private viewport: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 };

    private elements: WhiteboardElement[] = [];
    private peerCursors: Map<number, { x: number; y: number; name: string }> = new Map();

    // Public tool state
    currentTool: Tool = 'pen';
    currentColor: string = '#000000';
    currentWidth: number = 3;
    showGrid: boolean = true;
    onElementAdded: ((el: WhiteboardElement) => void) | null = null;
    onCursorMove: ((x: number, y: number) => void) | null = null;

    private activeTemplate: Template | null = null;
    private activePath2D: Path2D | null = null;
    private cursorOverCanvas = false;

    // Internal drawing state
    private movement = { isMoving: false, lastX: 0, lastY: 0 };
    private isDrawing = false;
    private drawStart = { x: 0, y: 0 };
    private currentPoints: { x: number; y: number }[] = [];
    private cursorWorld = { x: 0, y: 0 };
    private cursorScreenPos = { x: 0, y: 0 };
    private lastCursorEmit = 0;
    private textInputActive = false;
    private textInputCooldown = 0;

    constructor(wrapperElement: HTMLDivElement, canvasElement: HTMLCanvasElement) {
        this.wrapperElement = wrapperElement;
        this.canvasElement = canvasElement;

        const resize = () => {
            let size = this.wrapperElement.getBoundingClientRect();
            this.canvasElement.width  = size.width;
            this.canvasElement.height = 10;

            size = this.wrapperElement.getBoundingClientRect();
            this.canvasElement.width = size.width;
            this.canvasElement.height = size.height;
            this.canvasSize = { width: size.width, height: size.height };
        };
        resize();

        const ctx = this.canvasElement.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");
        this.ctx = ctx;

        window.addEventListener("resize", resize);

        this.canvasElement.addEventListener("mouseenter", () => { this.cursorOverCanvas = true; });
        this.canvasElement.addEventListener("mouseleave", () => { this.cursorOverCanvas = false; });

        // Scoped to wrapper so the AI chat panel can still scroll
        this.wrapperElement.addEventListener("wheel", (e) => {
            if (!e.ctrlKey) {
                e.preventDefault();
                this.zoom(e.deltaY * -1);
            }
        }, { passive: false });

        this.canvasElement.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            if (this.currentTool === 'pan') {
                this.movement.isMoving = true;
                this.movement.lastX = e.clientX;
                this.movement.lastY = e.clientY;
            } else if (this.currentTool === 'text') {
                // Text input is handled by the click event (after full click cycle)
                // so focus isn't stolen by the mousedown processing
            } else {
                this.isDrawing = true;
                const world = this.screenToWorld(e.clientX, e.clientY);
                this.drawStart = world;
                this.currentPoints = [world];
            }
        });

        // Text tool: use click (fires after mouseup) so the input can be focused cleanly
        this.canvasElement.addEventListener("click", (e) => {
            if (this.currentTool !== 'text') return;
            if (this.textInputActive) return;
            // Brief cooldown after a finalize so blur-then-click doesn't reopen immediately
            if (Date.now() - this.textInputCooldown < 120) return;
            const world = this.screenToWorld(e.clientX, e.clientY);
            this.handleTextInput(world.x, world.y);
        });

        window.addEventListener("mousemove", (e) => {
            if (this.isDrawing && e.buttons !== 1) {
                this.isDrawing = false;
                this.currentPoints = [];
                return;
            }

            this.cursorScreenPos = { x: e.clientX, y: e.clientY };
            const world = this.screenToWorld(e.clientX, e.clientY);
            this.cursorWorld = world;

            // Throttled cursor broadcast (max 20fps)
            const now = Date.now();
            if (this.onCursorMove && now - this.lastCursorEmit > 50) {
                this.lastCursorEmit = now;
                this.onCursorMove(world.x, world.y);
            }

            if (this.currentTool === 'pan' && this.movement.isMoving) {
                const dx = e.clientX - this.movement.lastX;
                const dy = e.clientY - this.movement.lastY;
                this.move(dx, dy);
                this.movement.lastX = e.clientX;
                this.movement.lastY = e.clientY;
            } else if (this.isDrawing && (this.currentTool === 'pen' || this.currentTool === 'eraser')) {
                this.currentPoints.push(world);
            }
        });

        window.addEventListener("mouseup", (e) => {
            if (e.button !== 0) return;
            if (this.currentTool === 'pan') {
                this.movement.isMoving = false;
            } else if (this.isDrawing) {
                this.isDrawing = false;
                const world = this.screenToWorld(e.clientX, e.clientY);
                this.finalizeElement(world);
            }
        });

        window.requestAnimationFrame(() => this.draw());
    }

    // --- Public API ---

    setTool(tool: Tool) { this.currentTool = tool; }
    setColor(color: string) { this.currentColor = color; }
    setWidth(width: number) { this.currentWidth = width; }
    setGrid(v: boolean) { this.showGrid = v; }
    setTemplate(t: Template | null) {
        this.activeTemplate = t;
        this.activePath2D = t ? new Path2D(t.svgPath) : null;
    }

    addElement(el: WhiteboardElement) {
        this.elements.push(el);
    }

    removeById(id: string) {
        const idx = this.elements.findIndex(e => e.id === id);
        if (idx !== -1) this.elements.splice(idx, 1);
    }

    setPeerCursor(userId: number, name: string, x: number, y: number) {
        this.peerCursors.set(userId, { x, y, name });
    }

    removePeerCursor(userId: number) {
        this.peerCursors.delete(userId);
    }

    exportPng(): void {
        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = this.canvasElement.toDataURL('image/png');
        link.click();
    }

    // --- Coordinate conversion ---

    private screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const rect = this.canvasElement.getBoundingClientRect();
        const sx = screenX - rect.left;
        const sy = screenY - rect.top;
        const wx = (sx - this.viewport.x - this.canvasSize.width / 2) / this.viewport.zoom;
        const wy = -((sy - this.viewport.y - this.canvasSize.height / 2) / this.viewport.zoom);
        return { x: wx, y: wy };
    }

    private worldToScreen(wx: number, wy: number): { x: number; y: number } {
        return {
            x: wx * this.viewport.zoom + this.viewport.x + this.canvasSize.width / 2,
            y: -wy * this.viewport.zoom + this.viewport.y + this.canvasSize.height / 2,
        };
    }

    // --- Element finalization ---

    private finalizeElement(end: { x: number; y: number }) {
        let el: WhiteboardElement | null = null;
        const { x, y } = this.drawStart;

        switch (this.currentTool) {
            case 'pen':
                if (this.currentPoints.length >= 2) {
                    el = {
                        type: 'path',
                        x: this.currentPoints[0].x,
                        y: this.currentPoints[0].y,
                        points: [...this.currentPoints],
                        color: this.currentColor,
                        width: this.currentWidth,
                    } as PathElement;
                }
                break;

            case 'eraser':
                if (this.currentPoints.length >= 2) {
                    el = {
                        type: 'path',
                        x: this.currentPoints[0].x,
                        y: this.currentPoints[0].y,
                        points: [...this.currentPoints],
                        color: '#ffffff',
                        width: this.currentWidth * 5,
                    } as PathElement;
                }
                break;

            case 'line':
                el = {
                    type: 'line',
                    x, y, x2: end.x, y2: end.y,
                    color: this.currentColor,
                    width: this.currentWidth,
                } as LineElement;
                break;

            case 'rect':
                el = {
                    type: 'rect',
                    x: Math.min(x, end.x),
                    y: Math.max(y, end.y),
                    width: Math.abs(end.x - x),
                    height: Math.abs(end.y - y),
                    color: this.currentColor,
                } as RectElement;
                break;

            case 'ellipse':
                el = {
                    type: 'ellipse',
                    x: (x + end.x) / 2,
                    y: (y + end.y) / 2,
                    radiusX: Math.abs(end.x - x) / 2,
                    radiusY: Math.abs(end.y - y) / 2,
                    color: this.currentColor,
                } as EllipseElement;
                break;
        }

        this.currentPoints = [];
        if (!el) return;

        el.id = crypto.randomUUID();
        this.elements.push(el);
        this.onElementAdded?.(el);
    }

    // --- Text input overlay ---

    private handleTextInput(wx: number, wy: number) {
        this.textInputActive = true;

        const screen = this.worldToScreen(wx, wy);
        const canvasRect = this.canvasElement.getBoundingClientRect();

        const scaledFontSize = Math.round(Math.max(13, 16 * this.viewport.zoom));

        // Determine a contrasting border colour (drawing colour) but always use dark text
        // so the input is readable regardless of which drawing colour is selected.
        const borderColor = this.currentColor || '#3377ff';

        const input = document.createElement('input');
        input.type = 'text';
        Object.assign(input.style, {
            position:     'fixed',
            left:         `${canvasRect.left + screen.x}px`,
            top:          `${canvasRect.top  + screen.y}px`,
            transform:    'translateY(-50%)',
            background:   '#ffffff',
            border:       `2px solid ${borderColor}`,
            borderRadius: '3px',
            padding:      '3px 7px',
            fontSize:     `${scaledFontSize}px`,
            fontFamily:   'sans-serif',
            color:        '#111111',   // Always dark — actual element uses currentColor
            outline:      'none',
            minWidth:     '90px',
            zIndex:       '9999',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.25)',
        });

        document.body.appendChild(input);
        // Defer focus until after the click event cycle completes
        requestAnimationFrame(() => input.focus());

        const finalize = () => {
            this.textInputActive = false;
            this.textInputCooldown = Date.now();
            const text = input.value.trim();
            input.remove();
            if (!text) return;
            const el: TextElement = {
                id: crypto.randomUUID(),
                type: 'text',
                x: wx, y: wy,
                text,
                fontSize: 16,
                color: this.currentColor,
            };
            this.elements.push(el);
            this.onElementAdded?.(el);
        };

        input.addEventListener('blur', finalize);
        input.addEventListener('keydown', (e) => {
            // Prevent Ctrl+Z undo from firing while typing
            e.stopPropagation();
            if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.value = '';   input.blur(); }
        });
    }

    // --- Draw methods ---

    private drawPath(ctx: CanvasRenderingContext2D, element: PathElement) {
        if (element.points.length < 2) return;
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, -element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, -element.points[i].y);
        }
        ctx.stroke();
    }

    private drawLine(ctx: CanvasRenderingContext2D, element: LineElement) {
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(element.x, -element.y);
        ctx.lineTo(element.x2, -element.y2);
        ctx.stroke();
    }

    private drawRect(ctx: CanvasRenderingContext2D, element: RectElement) {
        ctx.fillStyle = element.color;
        ctx.fillRect(element.x, -element.y, element.width, element.height);
    }

    private drawEllipse(ctx: CanvasRenderingContext2D, element: EllipseElement) {
        ctx.fillStyle = element.color;
        ctx.beginPath();
        ctx.ellipse(element.x, -element.y, element.radiusX, element.radiusY, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    private drawText(ctx: CanvasRenderingContext2D, element: TextElement) {
        ctx.fillStyle = element.color;
        ctx.font = `${element.fontSize}px sans-serif`;
        ctx.fillText(element.text, element.x, -element.y);
    }

    private drawElement(ctx: CanvasRenderingContext2D, element: WhiteboardElement) {
        switch (element.type) {
            case "path":    return this.drawPath(ctx, element as PathElement);
            case "line":    return this.drawLine(ctx, element as LineElement);
            case "rect":    return this.drawRect(ctx, element as RectElement);
            case "ellipse": return this.drawEllipse(ctx, element as EllipseElement);
            case "text":    return this.drawText(ctx, element as TextElement);
        }
    }

    private drawGhost(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = 0.6;
        const cur = this.cursorWorld;
        const start = this.drawStart;

        switch (this.currentTool) {
            case 'pen':
                if (this.currentPoints.length >= 2) {
                    this.drawPath(ctx, {
                        type: 'path', x: start.x, y: start.y,
                        points: this.currentPoints,
                        color: this.currentColor,
                        width: this.currentWidth,
                    } as PathElement);
                }
                break;

            case 'eraser':
                if (this.currentPoints.length >= 2) {
                    this.drawPath(ctx, {
                        type: 'path', x: start.x, y: start.y,
                        points: this.currentPoints,
                        color: '#ffffff',
                        width: this.currentWidth * 5,
                    } as PathElement);
                }
                break;

            case 'line':
                this.drawLine(ctx, {
                    type: 'line', x: start.x, y: start.y,
                    x2: cur.x, y2: cur.y,
                    color: this.currentColor,
                    width: this.currentWidth,
                } as LineElement);
                break;

            case 'rect':
                this.drawRect(ctx, {
                    type: 'rect',
                    x: Math.min(start.x, cur.x),
                    y: Math.max(start.y, cur.y),
                    width: Math.abs(cur.x - start.x),
                    height: Math.abs(cur.y - start.y),
                    color: this.currentColor,
                } as RectElement);
                break;

            case 'ellipse':
                this.drawEllipse(ctx, {
                    type: 'ellipse',
                    x: (start.x + cur.x) / 2,
                    y: (start.y + cur.y) / 2,
                    radiusX: Math.abs(cur.x - start.x) / 2,
                    radiusY: Math.abs(cur.y - start.y) / 2,
                    color: this.currentColor,
                } as EllipseElement);
                break;
        }

        ctx.globalAlpha = 1;
    }

    private drawPeerCursors() {
        const ctx = this.ctx;
        // Draw in screen space so cursors stay the same size regardless of zoom
        ctx.resetTransform();

        for (const [userId, cursor] of this.peerCursors) {
            const screen = this.worldToScreen(cursor.x, cursor.y);
            const color = CURSOR_COLORS[userId % CURSOR_COLORS.length];

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 6, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = color;
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(cursor.name, screen.x + 10, screen.y - 4);
        }
    }

    private drawLocalCursor() {
        if (!this.cursorOverCanvas || this.currentTool === 'pan') return;
        const ctx = this.ctx;
        ctx.resetTransform();

        const { x, y } = this.worldToScreen(this.cursorWorld.x, this.cursorWorld.y);

        if (this.currentTool === 'eraser') {
            const radius = Math.max(6, (this.currentWidth * 2.5) * this.viewport.zoom);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#555';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            const size = 8;
            const gap  = 3;
            ctx.lineCap = 'round';

            // White outline for visibility on dark elements
            ctx.lineWidth   = 3;
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(x - size, y); ctx.lineTo(x - gap, y);
            ctx.moveTo(x + gap,  y); ctx.lineTo(x + size, y);
            ctx.moveTo(x, y - size); ctx.lineTo(x, y - gap);
            ctx.moveTo(x, y + gap);  ctx.lineTo(x, y + size);
            ctx.stroke();

            // Dark crosshair on top
            ctx.lineWidth   = 1;
            ctx.strokeStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(x - size, y); ctx.lineTo(x - gap, y);
            ctx.moveTo(x + gap,  y); ctx.lineTo(x + size, y);
            ctx.moveTo(x, y - size); ctx.lineTo(x, y - gap);
            ctx.moveTo(x, y + gap);  ctx.lineTo(x, y + size);
            ctx.stroke();
        }
    }

    private draw() {
        // Recompute from screen coords so ghost preview stays correct after pan/zoom
        this.cursorWorld = this.screenToWorld(this.cursorScreenPos.x, this.cursorScreenPos.y);

        const ctx = this.ctx;

        ctx.resetTransform();
        ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);

        ctx.translate(this.viewport.x + this.canvasSize.width / 2, this.viewport.y + this.canvasSize.height / 2);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);

        const tb = {
            left:   (-this.canvasSize.width  / 2 - this.viewport.x) / this.viewport.zoom,
            right:  ( this.canvasSize.width  / 2 - this.viewport.x) / this.viewport.zoom,
            top:    (-this.canvasSize.height / 2 - this.viewport.y) / this.viewport.zoom,
            bottom: ( this.canvasSize.height / 2 - this.viewport.y) / this.viewport.zoom,
        };

        // Grid (optional)
        if (this.showGrid) {
            ctx.strokeStyle = "#00000022";
            ctx.lineWidth = 1;
            ctx.beginPath();
            const gridSize = 100;
            const startX = Math.floor(tb.left  / gridSize) * gridSize;
            const endX   = Math.ceil (tb.right / gridSize) * gridSize;
            const startY = Math.floor(tb.top    / gridSize) * gridSize;
            const endY   = Math.ceil (tb.bottom / gridSize) * gridSize;

            for (let x = startX; x <= endX; x += gridSize) {
                ctx.moveTo(x, tb.top);
                ctx.lineTo(x, tb.bottom);
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.moveTo(tb.left,  y);
                ctx.lineTo(tb.right, y);
            }
            ctx.stroke();

            // Center axes
            ctx.strokeStyle = "#ff000055";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, tb.top);    ctx.lineTo(0, tb.bottom);
            ctx.moveTo(tb.left, 0);   ctx.lineTo(tb.right, 0);
            ctx.stroke();
        }

        // Template guide (semi-transparent, drawn before elements so drawings appear on top)
        if (this.activeTemplate) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = '#4477dd';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([7, 4]);
            ctx.fillStyle = 'rgba(80, 130, 220, 0.05)';

            // SVG path is in 0-200 space, centered at (100,100).
            // Shift so the center aligns with the world origin.
            ctx.translate(-100, -100);

            if (this.activePath2D) {
                ctx.fill(this.activePath2D);
                ctx.stroke(this.activePath2D);
            }

            ctx.setLineDash([]);
            ctx.restore();
        }

        // Elements
        for (const element of this.elements) {
            this.drawElement(ctx, element);
        }

        // Ghost preview while drawing
        if (this.isDrawing) {
            this.drawGhost(ctx);
        }

        // Peer cursors + local cursor indicator (screen-space, must be last)
        if (this.peerCursors.size > 0) {
            this.drawPeerCursors();
        }
        this.drawLocalCursor();

        window.requestAnimationFrame(() => this.draw());
    }

    private move(dx: number, dy: number) {
        this.viewport.x += dx;
        this.viewport.y += dy;
        const limit = 5000;
        this.viewport.x = Math.max(-limit, Math.min(limit, this.viewport.x));
        this.viewport.y = Math.max(-limit, Math.min(limit, this.viewport.y));
    }

    private zoom(delta: number) {
        if (delta > 0) {
            this.viewport.zoom += Math.log(1 + delta / 100) * 0.1;
        } else {
            this.viewport.zoom -= Math.log(1 - delta / 100) * 0.1;
        }
        this.viewport.zoom = Math.max(0.1, Math.min(10, this.viewport.zoom));
    }
}

export default Whiteboard;
