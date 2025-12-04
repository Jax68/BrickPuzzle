class TouchController {
    constructor(app) {
        this.app = app;
        
        // Константы
        this.constants = {
            DOUBLE_TAP_DELAY: 300,      // ms
            LONG_PRESS_DELAY: 500,      // ms
            ROTATION_ZONE_HEIGHT: 50,   // px
            MIN_SWIPE_DISTANCE: 50,     // px
            TAP_MOVE_TOLERANCE: 10,     // px
            DRAG_THRESHOLD: 5           // px
        };
        
        // Состояние
        this.doubleTapTimout = null;
        this.longPressTimeout = null;
        this.touchStart = null;
        this.isDragging = false;
        this.isRotating = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const target = e.target;
        
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            target: target,
            time: Date.now(),
            brick: this.app.getParentBrickElement(target),
            startedInRotationZone: this.checkRotationZone(touch.clientY)
        };
        
        // Сбрасываем флаги
        this.isRotating = false;
        this.isDragging = false;
        
        // Если начали в зоне вращения и есть выбранный пазл - готовимся к вращению
        if (this.touchStart.startedInRotationZone && this.app.selectedBrick) {
            this.rotationStartX = touch.clientX;
            this.isRotating = true;
        }
        
        // Запускаем таймер долгого нажатия ВСЕГДА
        this.longPressTimeout = setTimeout(() => {
            this.handleLongPress();
        }, this.constants.LONG_PRESS_DELAY);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        if (!this.touchStart) return;
        
        const deltaX = touch.clientX - this.touchStart.x;
        const deltaY = touch.clientY - this.touchStart.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Если движение достаточно большое - отменяем долгое нажатие
        // if (distance > this.constants.TAP_MOVE_TOLERANCE) {
            if (this.longPressTimeout) clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        // }
        
        // Если начали ВНЕ зоны вращения - только перемещаем
        if (!this.touchStart.startedInRotationZone) {
            this.handleDragging(touch, deltaX, deltaY, distance);
        }
        // Если начали В зоне вращения и есть выбранный пазл - только вращаем
        else if (this.touchStart.startedInRotationZone && this.app.selectedBrick) {
            this.handleRotation(touch.clientX);
        }
    }
    
    handleTouchEnd(e) {
        this.app.preventMouse = true;

        const touch = e.changedTouches[0];
        
        if (!this.touchStart) return;
        
        const duration = Date.now() - this.touchStart.time;
        const distance = this.calculateDistance(
            touch.clientX, touch.clientY,
            this.touchStart.x, this.touchStart.y
        );
        
        // Отменяем долгое нажатие
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }
        
        // Обрабатываем тап только если не было драга и не было вращения
        if (!this.isDragging && !this.isRotating && distance < this.constants.TAP_MOVE_TOLERANCE) {
            if (this.touchStart.brick) {
                this.handleBrickTap(this.touchStart.brick);
            } else {
                this.handleEmptyTap();
            }
        }
        
        // Сбрасываем состояние
        this.isDragging = false;
        this.isRotating = false;
        this.rotationStartX = null;
        this.touchStart = null;
    }
    
    handleDragging(touch, deltaX, deltaY, distance) {
        // Перемещаем только если есть выбранный пазл и движение достаточное
        if (this.app.selectedBrick && 
            !(this.touchStart.brick) && 
            distance > this.constants.DRAG_THRESHOLD) {
            
            this.isDragging = true;
            this.app.moveBrick(deltaX, deltaY);
            // Обновляем стартовую позицию для следующего перемещения
            this.touchStart.x = touch.clientX;
            this.touchStart.y = touch.clientY;
        }
    }
    
    handleRotation(currentX) {
        if (!this.rotationStartX) {
            this.rotationStartX = currentX;
            return;
        }
        
        const deltaX = currentX - this.rotationStartX;
        
        if (Math.abs(deltaX) > this.constants.MIN_SWIPE_DISTANCE) {
            const direction = deltaX > 0 ? 1 : -1;
            this.app.rotateBrick(direction);
            this.rotationStartX = currentX; // Сбрасываем для следующего вращения
        }
    }
    
    handleBrickTap(target) {
        // Берем пазл
        this.app.pickBrick(target);
    }
    
    handleEmptyTap() {
        // Проверяем двойной тап
        if (this.doubleTapTimout) {
            this.handleDoubleTap();    
        } else {
            // Ждём, если второго тапа не последовало - отрабатываем одинарный
            this.doubleTapTimout = setTimeout(() => {
                this.handleSingleTap();
            }, this.constants.DOUBLE_TAP_DELAY);
        }
    }

    handleSingleTap() {
        this.doubleTapTimout = null;

        // Одинарный тап - кладем пазл если есть выбранный
        if (this.app.selectedBrick) {
        	this.app.placeBrick();
        }
    }

    handleDoubleTap() {
        clearTimeout(this.doubleTapTimout);
        this.doubleTapTimout = null;

        // Двойной тап - отразить выбранный пазл        
        this.app.flipBrick();
    }
    
    handleLongPress() {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;

        if (this.app.selectedBrick) {
            // Если есть выбранный пазл - сбросить его
            this.app.resetBrick(this.app.selectedBrick);
        } else if (this.touchStart && (this.touchStart.brick)) {
            // Если нет выбранного, но тап был по пазлу - сбросить этот пазл
            this.app.resetBrick(this.touchStart.brick);
        }
        // Если нет выбранного и тап не по пазлу - ничего не делаем

        this.touchStart = null;
    }
    
    checkRotationZone(y) {
        // Проверяем, находится ли палец в зоне вращения (нижняя часть экрана)
        const rotationZoneTop = window.innerHeight - this.constants.ROTATION_ZONE_HEIGHT;
        return y >= rotationZoneTop;
    }
    
    // Вспомогательные методы
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    // Метод для очистки
    destroy() {
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchcancel', this.handleTouchEnd);
        
        if (this.longPressTimeout) {clearTimeout(this.longPressTimeout)};
        if (this.doubleTapTimout) {clearTimeout(this.doubleTapTimout)};
    }
}