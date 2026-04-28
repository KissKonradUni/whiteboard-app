class Whiteboard {
    private wrapperElement: HTMLDivElement;
    private canvasElement: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private canvasSize: { width: number; height: number } = { width: 0, height: 0 };
    private viewport: { x: number; y: number, zoom: number } = { x: 0, y: 0, zoom: 1 };

    private movement = { isMoving: false, lastX: 0, lastY: 0 };

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