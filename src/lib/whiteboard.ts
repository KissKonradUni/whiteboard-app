type WhiteboardElement = {
    type: "line" | "rect" | "ellipse" | "text";
    x: number;
    y: number;
}

type LineElement = WhiteboardElement & {
    type: "line";
    x2: number;
    y2: number;
    color: string;
    width: number;
}

type RectElement = WhiteboardElement & {
    type: "rect";
    width: number;
    height: number;
    color: string;
}

type EllipseElement = WhiteboardElement & {
    type: "ellipse";
    radiusX: number;
    radiusY: number;
    color: string;
}

type TextElement = WhiteboardElement & {
    type: "text";
    text: string;
    fontSize: number;
    color: string;
}

class Whiteboard {
    private wrapperElement: HTMLDivElement;
    private canvasElement: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private canvasSize: { width: number; height: number } = { width: 0, height: 0 };
    private viewport: { x: number; y: number, zoom: number } = { x: 0, y: 0, zoom: 1 };

    private movement = { isMoving: false, lastX: 0, lastY: 0 };

    private elements: WhiteboardElement[] = [];

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
        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }
        this.ctx = ctx;

        window.addEventListener("resize", resize);
        window.addEventListener("wheel", (e) => {
            if (!e.ctrlKey) {
                e.preventDefault();
                this.zoom(e.deltaY * -1);
            }
        }, { passive: false });
        window.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                this.movement.isMoving = true;
                this.movement.lastX = e.clientX;
                this.movement.lastY = e.clientY;
            }
        });
        window.addEventListener("mousemove", (e) => {
            if (this.movement.isMoving) {
                const dx = e.clientX - this.movement.lastX;
                const dy = e.clientY - this.movement.lastY;
                this.move(dx, dy);
                this.movement.lastX = e.clientX;
                this.movement.lastY = e.clientY;
            }
        });
        window.addEventListener("mouseup", (e) => {
            if (e.button === 0) {
                this.movement.isMoving = false;
            }
        });
        window.requestAnimationFrame(() => this.draw());

        // Add random elements for testing
        this.elements.push(
            { type: "line", x: -100, y: -100, x2: 100, y2: 100, color: "red", width: 5 } as LineElement,
            { type: "rect", x: -150, y: -50, width: 100, height: 50, color: "blue" } as RectElement,
            { type: "ellipse", x: 100, y: 100, radiusX: 50, radiusY: 25, color: "green" } as EllipseElement,
            { type: "text", x: -200, y: 200, text: "Hello World!", fontSize: 24, color: "purple" } as TextElement,
        );
    }

    private drawLine(ctx: CanvasRenderingContext2D, element: LineElement) {
        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.width;
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
            case "line":
                return this.drawLine(ctx, element as LineElement);
            case "rect":
                return this.drawRect(ctx, element as RectElement);
            case "ellipse":
                return this.drawEllipse(ctx, element as EllipseElement);
            case "text":
                return this.drawText(ctx, element as TextElement);
        }
    }

    private draw() {
        const ctx = this.ctx;

        ctx.resetTransform();

        ctx.fillStyle = "#ffffff";
        ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);

        ctx.translate(this.viewport.x + this.canvasSize.width / 2, this.viewport.y + this.canvasSize.height / 2);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);

        const transformedBounds = {
            left: (-this.canvasSize.width / 2 - this.viewport.x) / this.viewport.zoom,
            right: (this.canvasSize.width / 2 - this.viewport.x) / this.viewport.zoom,
            top: (-this.canvasSize.height / 2 - this.viewport.y) / this.viewport.zoom,
            bottom: (this.canvasSize.height / 2 - this.viewport.y) / this.viewport.zoom,
        }

        ctx.strokeStyle = "#00000044";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Grid lines every 100 units, only within the visible area
        const gridSize = 100;
        const startX = Math.floor(transformedBounds.left / gridSize) * gridSize;
        const endX = Math.ceil(transformedBounds.right / gridSize) * gridSize;
        const startY = Math.floor(transformedBounds.top / gridSize) * gridSize;
        const endY = Math.ceil(transformedBounds.bottom / gridSize) * gridSize;

        for (let x = startX; x <= endX; x += gridSize) {
            ctx.moveTo(x, transformedBounds.top);
            ctx.lineTo(x, transformedBounds.bottom);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.moveTo(transformedBounds.left, y);
            ctx.lineTo(transformedBounds.right, y);
        }

        ctx.stroke();

        // Center axes
        ctx.strokeStyle = "#ff0000aa";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, transformedBounds.top);
        ctx.lineTo(0, transformedBounds.bottom);
        ctx.moveTo(transformedBounds.left, 0);
        ctx.lineTo(transformedBounds.right, 0);
        ctx.stroke();

        // Draw elements
        for (const element of this.elements) {
            this.drawElement(ctx, element);
        }

        window.requestAnimationFrame(() => this.draw());
    }

    private move(dx: number, dy: number) {
        this.viewport.x += dx;
        this.viewport.y += dy;

        // Limit panning to a reasonable area (e.g., 5000x5000 units)
        const limit = 5000;
        this.viewport.x = Math.max(-limit, Math.min(limit, this.viewport.x));
        this.viewport.y = Math.max(-limit, Math.min(limit, this.viewport.y));
    }

    private zoom(delta: number) {
        // Logrithmic zooming for natural feel, clamped to reasonable limits
        if (delta > 0) {
            this.viewport.zoom += Math.log(1 + delta / 100) * 0.1;
        }
        else {
            this.viewport.zoom -= Math.log(1 - delta / 100) * 0.1;
        }
        this.viewport.zoom = Math.max(0.1, Math.min(10, this.viewport.zoom));
    }
}

export default Whiteboard;