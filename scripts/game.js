class Game {
    static grid = {
        colCount: 21,
        rowCount: 15,
    }

    static board = {
        colCount: 10,
        rowCount: 6,
        col: 6,
        row: 5,
    }

    #timeSpent;             // продолжительность игры в секундах
    #bricks = [];           // массив кирпичей в игре
    #selectedBrick = -1;    // объект brick для выбранного кирпича
    #completed = false;     // признак завершения
    #tickIntervalId = null; // объект таймера

    #onTimeSpentChangeHandler = null;   // обработчик измененеия затраченного времени
    #onBrickChangeHandler = null;       // обработчик изменения кирпича
    #onBrickSelectHandler = null;       // обработчик выделения кирпича
    #onBrickDeselectHandler = null;     // обработчик снятия выделения кирпича
    #onCompletedChangeHandler = null;    // обработчик изменения статуса завершения

    constructor() {
        this.#bricks = Array.from({ length: this.defaults.bricks.length }, () => ({}));
    }

    /* Статические методы */

    static #notify(handler, event = null) {
        // console.log('notify', handler, event);
        if (handler) setTimeout(() => handler(event), 0);
    }

    static #brickFitsBoard(col, row, matrix, board) {
        return (col >= board.col) && (row >= board.row) && 
                ((col + matrix[0].length) <= (board.col + board.colCount)) &&
                ((row + matrix.length) <= (board.row + board.rowCount));
    }

    static #bricksHasCollisions(matrix1, matrix2, deltaCol, deltaRow) {
        for (let j = 0; j < matrix1.length; j++) for (let i = 0; i < matrix1[0].length; i++) {
            const cell1 = matrix1?.[j]?.[i] ?? 0;
            const cell2 = matrix2?.[j - deltaRow]?.[i - deltaCol] ?? 0;
            if (cell1 && cell2) return true;
        }
        return false;
    }

    static #canPlaceBrick(col, row, matrix, board, bricks) {
        // если кирпич не находится в пределах поля - возвращаем "нет"
        if (!Game.#brickFitsBoard(col, row, matrix, board)) return false;

        // если есть коллизия с каким-либо кирпичём из списка - возвращаем "нет"
        if (bricks.some(brick => Game.#bricksHasCollisions(brick.matrix, matrix, col - brick.col, row - brick.row)))
            return false;

        // если всё ок - возвращаем "да"
        return true;
    }

    static #encodeData(data) {
        try {
            const jsonString = JSON.stringify(data);
            // Добавляем префикс для идентификации и кодируем в base64
            const dataToEncode = `BPZv1|${jsonString}`;
            return btoa(unescape(encodeURIComponent(dataToEncode)));
        } catch (error) {
            console.error('Ошибка кодирования:', error);
            return null;
        }
    }

    static #decodeData(encodedString) {
        try {
            // Декодируем из base64
            const decodedString = decodeURIComponent(escape(atob(encodedString)));
            
            // Проверяем версию формата
            if (decodedString.startsWith('BPZv1|')) {
                const jsonString = decodedString.substring(6);
                return JSON.parse(jsonString);
            }
        } catch (error) {
            console.error('Ошибка декодирования:', error);
        }
    }

    /* Приватные методы */

    #setTimeSpent(value) {
        if (this.#timeSpent != value) {
            this.#timeSpent = value;
            Game.#notify(this.#onTimeSpentChangeHandler, this.#timeSpent);
        }
    }

    #getBrick(index) {
        if (typeof index === 'number' && index >= 0 && index < this.#bricks.length)
            return this.#bricks[index]
        else
            return null;        
    }

    #copyBrick(index) {
        const current = this.#getBrick(index);
        if (current) {
            const copy = { ...current };
            copy.matrix = current.matrix.map(row => [...row]);
            return copy;
        } else
            return null;        
    }

    #setBrick(index, updated) {
        const current = this.#getBrick(index);
        if (current) {
            const event = {};           
            
            if (!Matrix.isEqual(current.matrix, updated.matrix)) {
                current.matrix = updated.matrix.map(row => [...row]);
                event.matrix = current.matrix.map(row => [...row]);
            }
            
            if (current.col !== updated.col || current.row !== updated.row) {
                current.col = updated.col;
                current.row = updated.row;
                event.col = current.col;
                event.row = current.row;
            }
            
            if (current.placed !== updated.placed) {
                if (updated.placed === true) {
                    current.placed = true;
                    event.placed = true;
                } else {
                    delete current.placed;
                    delete event.placed;
                }
            }
            
            if (Object.keys(event).length > 0) {
                event.index = index;
                Game.#notify(this.#onBrickChangeHandler, event);
            }
        }
    }

    #setSelectedBrick(value) {
        if (typeof value === 'number' && value >= -1 && value < this.#bricks.length && this.#selectedBrick != value) {
            if (this.#selectedBrick >= 0) Game.#notify(this.#onBrickDeselectHandler, this.#selectedBrick);
            if (value >= 0) Game.#notify(this.#onBrickSelectHandler, value);
            this.#selectedBrick = value;
        }
    }

    #setCompleted(value) {
        if (this.#completed != value) {
            this.#completed = value;
            Game.#notify(this.#onCompletedChangeHandler, this.#completed);
        }
    }

    #getState() {
        return {
            timeSpent: this.#timeSpent,
            bricks: this.#bricks,
        };
    }

    #setState(state) {
        this.#setTimeSpent(state.timeSpent);
        if (Array.isArray(state.bricks))
            state.bricks.forEach((brick, index) => this.#setBrick(index, brick));
        this.#checkCompleted();
    }

    #isStateValid(state) {
        try {
            // Сравниваем кол-во кирпичей
            if (state.bricks.length != this.defaults.bricks.length) return false;

            // Ищем соответствие для всех кирпичей
            for (let i = 0; i < state.bricks.length; i++)
                if (state.bricks[i].placed) {
                    // Если кирпич в поле, для начала проверяем идентична ли его матрица кирпичу из набора (без учёта поворотов и отражений)
                    if (!Matrix.isRelated(state.bricks[i].matrix, this.defaults.bricks[i].matrix)) return false;
                    
                    // Проверяем помещается ли кирпич на доску
                    if (!Game.#brickFitsBoard(state.bricks[i].col, state.bricks[i].row, state.bricks[i].matrix, Game.board)) return false;

                    // Проверяем коллизии с каждым оставшимися кирпичём который предположительно в поле
                    for (let j = i + 1; j < state.bricks.length; j++)
                        if (state.bricks[j].placed)
                            if (Game.#bricksHasCollisions(state.bricks[i].matrix, state.bricks[j].matrix,
                                state.bricks[j].col - state.bricks[i].col, state.bricks[j].row - state.bricks[i].row)) 
                                return false;

                } else 
                    // Если кирпич не в поле, он должен быть в точности как из набора. В противном случае валидация не пройдена
                    if (state.bricks[i].col != this.defaults.bricks[i].col || state.bricks[i].row != this.defaults.bricks[i].row ||
                        !Matrix.isEqual(state.bricks[i].matrix, this.defaults.bricks[i].matrix)
                    ) return false;
        } catch(e) {
            console.log('Ошибка валидации данных:', e);
            return false;
        }

        return true;
    }

    #checkCompleted() {
        // если все кирпичи на доске - игра завершена
        this.#setCompleted(this.#bricks.every((brick) => (brick.placed === true)));

        // если игра завершена - останавливаем отсчёт времени, но НЕ сбрасываем счётчик
        if (this.#completed) this.#stopTimer(); else {
            // если на доске пусто - останавливаем таймер и сбрасываем счётчик
            if (!this.#bricks.some(brick => (brick.placed === true))) {
                this.#stopTimer();
                this.#setTimeSpent(0);
            } else
                // если "сборка в процессе" - убеждаемся, что таймер работает
                this.#startTimer();
        }
     }

    #startTimer() {
        if (!this.#tickIntervalId)
            this.#tickIntervalId = setInterval(() => this.#handleTick(), 1000);
    }

    #stopTimer() {
        if (this.#tickIntervalId) clearInterval(this.#tickIntervalId);
        this.#tickIntervalId = null;
    }

    #handleTick() {
        this.#setTimeSpent(this.#timeSpent + 1);
    }
  
    /* Публичные сеттеры для обработчиков */    

    set onTimeSpentChange(handler) {this.#onTimeSpentChangeHandler = handler}
    set onBrickChange(handler) {this.#onBrickChangeHandler = handler}
    set onBrickSelect(handler) {this.#onBrickSelectHandler = handler}
    set onBrickDeselectHandler(handler) {this.#onBrickDeselectHandler = handler}
    set onComletedChange(handler) {this.#onCompletedChangeHandler = handler}

    /* Публичные методы */

    get defaults() { return DEFAULT }

    // Берем кирпич "в руку"
    pickBrick(index) {
        if (this.#selectedBrick >= 0) return false; // Если что-то уже есть в руке - сразу нет 

        const brick = this.#getBrick(index);
        if (brick) {
            const wasPlaced = brick.placed;
            if (brick.placed) this.#setBrick(index, {...brick, placed: false})
            this.#setSelectedBrick(index);
            if (wasPlaced) this.#checkCompleted();
            return true;
        }
        return false;
    }

    // Возвращаем указанный кирпич в исходное состояние
    resetBrick(index) {
        const brick = this.#getBrick(index);
        if (brick) {
            const wasPlaced = brick.placed;
            this.#setBrick(index, this.defaults.bricks[index]);
            this.#setSelectedBrick(-1); // ВАЖНО! Только ПОСЛЕ сброса матрицы и координат
            if (wasPlaced) this.#checkCompleted();
            return true;
        }
        return false;
    }

    // Вращаем выбранный кирпича на заданный угол
    rotateBrick(a) {
        const brick = this.#getBrick(this.#selectedBrick);
        if (brick) {
            this.#setBrick(this.#selectedBrick, {...brick, matrix: Matrix.rotate(brick.matrix, a)});
            return true;
        }
        return false;
    }

    // Отражаем выбранный кирпич по горизонтали
    flipBrick() {
        const brick = this.#getBrick(this.#selectedBrick);
        if (brick) {
            this.#setBrick(this.#selectedBrick, {...brick, matrix: Matrix.flip(brick.matrix)});
            return true;
        }
        return false;
    }

    // Проверяем, можно ли его положить выбранный в заданной позиции
    canPlaceBrick(col, row) {
        const brick = this.#getBrick(this.#selectedBrick);
        if (brick)
            return Game.#canPlaceBrick(col, row, brick.matrix, Game.board, this.#bricks.filter((brick) => brick.placed)); 
        else 
            return false;
    }

    placeBrick(col, row) {
        if (this.canPlaceBrick(col, row)) {
            const brick = this.#getBrick(this.#selectedBrick);
            this.#setBrick(this.#selectedBrick, {
                matrix: brick.matrix,
                col: col,
                row: row,
                placed: true
            })
            this.#setSelectedBrick(-1);
            this.#checkCompleted();
            return true;
        } else
            return false;
    }

    newGame() {
        // this.#bricks = Array.from({ length: this.defaults.bricks.length }, () => ({}));
        this.#setState({
            timeSpent: 0,
            bricks: this.defaults.bricks
        });
    }

    loadGame(encodedString) {
        const state = Game.#decodeData(encodedString);

        // Если стэйт валидный - загружаем данные в игру
        if (this.#isStateValid(state)) {
            this.#setState(state);
            return true;
        }
    }

    saveGame() {
       if (this.#selectedBrick == -1) return Game.#encodeData(this.#getState());
    }

}