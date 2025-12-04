class App {

    constructor() {
        this.container = document.getElementById('container');
        
        // инициализирует переменные
        this.selectedBrick = null;
        this.gridRect;
        this.coordChecked = [];
        this.preventMouse = false;
        this.display = null;

        // Создаём объект игры
        this.game = new Game();
        this.game.onTimeSpentChange = (e) => this.handleTimeChange(e);
        this.game.onBrickChange = (e) => this.handleBrickChange(e);
        this.game.onBrickSelect = (e) => this.handleBrickSelect(e);
        this.game.onBrickDeselectHandler = (e) => this.handleBrickDeselectHandler(e);
        this.game.onComletedChange = (e) => this.handleComletedChange(e);

        // задаём размерность сетки для css
        document.documentElement.style.setProperty('--grid-col-count', `${Game.grid.colCount}`);
        document.documentElement.style.setProperty('--grid-row-count', `${Game.grid.rowCount}`);

        // Создаём меню
        this.menu = new Menu(this);

        // Определяем размерность сетки
        this.handleResize();

        // Инициализируем touch контроллер
        this.touchController = new TouchController(this);

        // Назначаем обработчики
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('wheel', this.handleMouseWheel);
        document.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);

        // Инициализируем UI
        this.init();

        // Пробуем загрузиться из локального хранилища, если не удалось - стартуем новую игру
        if (!this.loadFromState() === true) this.game.newGame();
    }

    get cell() {
        if (this.gridRect) return({
            width: this.gridRect.width / Game.grid.colCount,
            height: this.gridRect.height / Game.grid.rowCount
        }); else return({width: 0, height: 0})
    }

    init() {
        // очищаем контейнер
        this.container.innerHTML = '';

        // создаём доску
        const divBoard = document.createElement('div');
        divBoard.id = 'board';
        divBoard.className = 'socketed';
        this.renderBoard(divBoard, Game.board);
        this.container.appendChild(divBoard);

        // создаём элементы кирпичей
        this.game.defaults.bricks.forEach((brick, index) => {
            // создаём сокет
            const divSocket = document.createElement('div');
            this.renderBrick(divSocket, brick.matrix, brick.col, brick.row);
            divSocket.className = 'brick socketed';
            this.container.appendChild(divSocket);

            // создаём кирпич
            const divBrick = document.createElement('div');
            divBrick.className = 'brick item';
            divBrick.dataset.id = `${index}`;
            this.container.appendChild(divBrick);
        });

        // создаём дисплей
        this.display = document.createElement('div');
        this.display.className = 'display';
        this.display.style.visibility = this.menu.getCheckboxState('time') ? 'visible' : 'hidden';
        this.container.appendChild(this.display);

        // добавляем меню
        // this.container.appendChild(this.menu.container);
        document.body.appendChild(this.menu.container);

        // ну и логотип, конечно)
        this.container.appendChild(document.createElement('div')).id = 'logo';
    }

    loadFromState() {
        const encodedString = localStorage.getItem('game_state');
        if (encodedString) return this.game.loadGame(encodedString);
    }

    getGridCoord(x, y) {
        return {
            // позиция = координата_от_края_сетки / размер_ячейки (константы обновляемые при изменении размеров окна)
            col: Math.round((x - this.gridRect.left) * Game.grid.colCount / this.gridRect.width) + 1,
            row: Math.round((y - this.gridRect.top) * Game.grid.rowCount / this.gridRect.height) + 1
        }
    }

    canPlaceBrick(col, row) {
        this.coordChecked.forEach((coord) => { if (coord.col == col && coord.row == row) return coord.value }) // ищем ранее проверенные координаты
        const result = this.game.canPlaceBrick(Number(this.selectedBrick.dataset.id), col, row); // если не нашли, запрашиваем размещение у модели
        this.coordChecked.push(result); // запоминаем ответ
        return result;
    } 

    renderDisplay(text) {
        // Очищаем содержимое
        this.display.innerHTML = '';
        
        // Обрабатываем каждый символ текста
        text.split('').forEach(char => {
            const symbol = document.createElement('div');
            symbol.className = 'digit';
            
            // Определяем какой символ использовать
            let symbolId = 'space';
            if (/[0-9]/.test(char)) {
                symbolId = `d${char}`;
            } else if (char === ':') {
                symbolId = 'd';
            }
            symbol.style.backgroundImage = `url('images/digits/${symbolId}.svg')`;
            
            this.display.appendChild(symbol);
        });
    }

    renderBoard(div, board) {
        div.innerHTML = '';

        // размечаем доску с учётом габаритов
        div.style.gridTemplateColumns = `repeat(${board.colCount}, 1fr)`;
        div.style.gridTemplateRows = `repeat(${board.rowCount}, 1fr)`;

        // заполняем доску ячейками
        let content = '';
        for (let i = 0; i < board.colCount * board.rowCount; i++) content += '<div></div>';
        div.innerHTML = content;

        // позиционируем доску в сетке контейнера
        div.style.gridArea = `${board.row} / ${board.col} / ${board.row + board.rowCount} / ${board.col + board.colCount}`;
    }

    renderBrick(div, matrix, col, row) {
        if (matrix) {
            div.innerHTML = '';

            // создаём элементы блоков
            matrix.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        const block = document.createElement('div');
                        block.style.gridArea = `${rowIndex + 1} / ${colIndex + 1}`;
                        div.appendChild(block);
                    }
                });
            });

            // сохраняем в свойства элемента размерность матрицы
            div.dataset.colCount = matrix[0].length;
            div.dataset.rowCount = matrix.length;

            // размечаем кирпич с учётом габаритов
            div.style.gridTemplateColumns = `repeat(${div.dataset.colCount}, 1fr)`;
            div.style.gridTemplateRows = `repeat(${div.dataset.rowCount}, 1fr)`;

            // если кирпич таскается - обновляем размеры
            if (div.dataset.dragged) {
                div.style.width = Number(div.dataset.colCount) * this.cell.width + 'px';
                div.style.height = Number(div.dataset.rowCount) * this.cell.height + 'px';
            }
        }

        if ((typeof col === 'number') && (typeof row === 'number') && (div.dataset.colCount) && (div.dataset.rowCount)) {
            // позиционируем кирпич в сетке контейнера
            div.style.gridArea = `${row} / ${col} / ${row + Number(div.dataset.rowCount)} / ${col + Number(div.dataset.colCount)}`;
        }        
    }

    playSound(soundName) {
        if (this.menu.getCheckboxState('sound')) {
            const audio = document.getElementById(soundName);
            if (audio) {
                audio.play().catch(e => console.log('Ошибка воспроизведения:', e));
            }
        }
    }

    vibrate(pattern) {
        if (this.menu.getCheckboxState('vibration')) {

        }

    }

    startDrag(target) {
        if (!(target)) return;

        if (!target.dataset.dragged) {
            this.selectedBrick = target;

            // перемещаем на стартовые позиции
            const rect = this.selectedBrick.getBoundingClientRect();
            this.moveBrick(rect.left - this.gridRect.left, rect.top - this.gridRect.top);

            // задаем непосредственные размеры
            this.selectedBrick.style.width = Number(this.selectedBrick.dataset.colCount) * this.cell.width + 'px';
            this.selectedBrick.style.height = Number(this.selectedBrick.dataset.rowCount) * this.cell.height + 'px';

            this.selectedBrick.dataset.dragged = true;
        }
    }

    stopDrag() {
        if (this.selectedBrick) {
            delete this.selectedBrick.dataset.dragged;
            delete this.selectedBrick.dataset.x;
            delete this.selectedBrick.dataset.y;
            delete this.selectedBrick.dataset.lastX;
            delete this.selectedBrick.dataset.lastY;
            this.selectedBrick.style.width = "";
            this.selectedBrick.style.height = "";
        }
        this.selectedBrick = null;
    }

    getBrickElement(id) {
        return document.querySelector(`[data-id="${id}"]`);
    }

    getParentBrickElement(element) {
        return element.closest('[data-id]');
    }

    pickBrick(target) {
        if (!this.selectedBrick) 
            if (this.game.pickBrick(Number(target.dataset.id))) {
                this.playSound('soundPick');
                this.vibrate(100);
            }
    }

    moveBrick(deltaX, deltaY) {
        if (this.selectedBrick) {
            const x = (parseInt(this.selectedBrick.dataset.x) || 0) + deltaX;
            const y = (parseInt(this.selectedBrick.dataset.y) || 0) + deltaY;

            const rect = this.selectedBrick.getBoundingClientRect();
            
            // накладываем ограничения на перемещения
            const minX = -this.gridRect.left;
            const minY = -this.gridRect.top;
            const maxX = document.body.clientWidth + minX - rect.width;
            const maxY = document.body.clientHeight + minY - rect.height;

            this.selectedBrick.dataset.x = Math.max(minX, Math.min(maxX, x));
            this.selectedBrick.dataset.y = Math.max(minY, Math.min(maxY, y));
            this.selectedBrick.style.setProperty('--x', this.selectedBrick.dataset.x + 'px');
            this.selectedBrick.style.setProperty('--y', this.selectedBrick.dataset.y + 'px');
        }
    }

    rotateBrick(a) {
        if (this.game.rotateBrick(a)) {
            this.playSound('soundRotate');
            this.vibrate(100);
        }
    }

    flipBrick() {
        if (this.game.flipBrick()) {
            this.playSound('soundFlip');
            this.vibrate(100);
        }
    }

    resetBrick(target) {
        if (target) {
            if (this.game.resetBrick(Number(target.dataset.id))) {
                this.playSound('soundReset');
                this.vibrate(200);
            }
        }
    }

    placeBrick() {
        if (this.selectedBrick) {
            const rect = this.selectedBrick.getBoundingClientRect();
            const place = this.getGridCoord(rect.left, rect.top);
            if (this.game.placeBrick(place.col, place.row)) {
                this.playSound('soundPlace');
                this.vibrate(200);
            }
        }
    }

    restartGame() {
        this.game.newGame();
        this.playSound('soundRestart');
        this.vibrate([50, 20, 50, 20, 50]);
    }

    loadGame() {
        const dialog = new Dialog('Загрузка игры', [
            {
                label: 'ОК',
                handler: (dlg) => {
                    this.game.loadGame(dialog.getValue('codeInput'));
                    dlg.close(); 
                }
            }], true);
        dialog.addInput('Строка для загрузки', 'Вставьте ранее сохраненную строку', '', false, 'codeInput');
        dialog.show();
    }

    saveGame() {
        const dialog = new Dialog('Сохранение игры', [
            {
                label: 'ОК',
                handler: (dlg) => { dlg.close() }
            }], true);
        dialog.addInput('Строка для сохранения', '', this.game.saveGame(), true);
        dialog.show();
    }

    showHelp() {
        const helpDialog = new Dialog('Справка', [
            {
                label: 'Закрыть',
                handler: (dlg) => dlg.close()
            }
        ], true);

        // Добавляем TabControl в диалог
        helpDialog.addCustomHTML(`
            <div id="helpTabsContainer"></div>
        `);

        // Показываем диалог
        helpDialog.show();

        // Создаем TabControl после отображения диалога
        setTimeout(() => {
            const tabsContainer = document.getElementById('helpTabsContainer');
            const helpTabs = [
                {
                    glyphSrc: '',
                    label: 'Правила',
                    content: `
                        <h3>Блоки</h3>
                        <p>
                            У вас есть 12 различных блоков. Они расположены каждый в своём слоте.
                            Их можно брать, перемещать, вращать, переворачивать зеркально, класть в поле и возвращать на место.
                        </p>
                        <p>
                            Положить блок в поле можно только на свободное место, и только если он полностью помещается в поле.
                            Вернуть на место можно как блок "в руке", так и блок с поля.
                        </p>
                        <h3>Отсчёт времени</h3>
                        <p>
                            Справа сверху от поля отображается время, которое прошло с момента, когда вы положили на поле первый блок.
                            Если убрать все блоки с поля - отсчет времени остановится и отсчет начнется заново, когда на поле вновь появится блок.
                            Когда пазл собран, отсчет времени останавливается.
                        </p>
                        <h3>Сброс/Сохранения/Загрузка</h3>
                        <p>
                            В любой момент вы можете начать новую игру. Все блоки вернутся на место, сетчик времени будет сброшен.
                            Также в любой момент вы можете скопировать текущее состояние игры в виде строки, которой можно поделиться
                            или сохранить на память. Сохраняется не только расположение блоков, но и счетчик времени.
                            Если у вас есть строка с сохраненной игрой, её можно загрузить через окно загрузки.
                            Все эти действия можно осуществить из игрового меню.
                        </p>
                        <h3>Цель игры</h3>
                        <p>
                            Ваша задача заполнить поле блоками. Если все блоки на поле - вы победили!
                            Несмотря на то, что уникальных способов заполнить поле великое множество, поиск очередного может стать небыстрым ;)
                        </p>
                        <p>
                            УДАЧИ!
                        </p>
                    `
                },
                {
                    glyphSrc: '',
                    label: 'Управление',
                    content: `
                        <h3>Клавиатура/мышь</h3>
                        <p>
                            <b>Взять блок</b> - Левая кнопка мыши<br />
                            <b>Вращать</b> - Колёсико мыши/Клавиши влево/вправо<br />
                            <b>Отразить зеркально</b> - Средняя кнопка мыши/Пробел<br />
                            <b>Положить в поле</b> - Левая кнопка мыши<br />
                            <b>Вернуть на место</b> - Правая кнопка мыши/Esc<br />                            
                        </p>
                        <h3>Сенсорный ввод</h3>
                        <p>
                            <b>Взять блок</b> - Тап по блоку<br />
                            <b>Вращать</b> - Свайп влево/вправо по нижней кромке экрана<br />
                            <b>Отразить зеркально</b> - Двойной тап в свободной области<br />
                            <b>Положить в поле</b> - Одиночный тап в свободной области<br />
                            <b>Вернуть на место</b> - Долгий тап<br />                            
                        </p>
                    `
                },
                {
                    glyphSrc: '',
                    label: 'О программе',
                    content: `
                        <div style="display: flex; align-items: center; margin-top: 8px; gap:4px">
                            <span class="about-icon"></span>
                            <h3 style="margin: 0;">Brick Puzzle</h3>
                        </div>
                        <div style="display: flex; align-items: center; margin-top: 16px; gap:36px">
                            <a>JXDesign 2025</a>
                            <a href="mailto:jxbox@mail.ru">jxbox@mail.ru</a>
                        </div>
                    `
                }
            ];
            new TabControl(tabsContainer, helpTabs);
        }, 50);
    }

    toggleSound(isChecked) {}

    toggleVibration(isChecked) {}
    
    toggleTimeDisplay(isChecked) {
        if (this.display) this.display.style.visibility = isChecked ? 'visible' : 'hidden';
    }

    handleMouseMove = (e) => {
        if (this.preventMouse) {
            return;
        }

        if (this.selectedBrick) {
            const lastX = parseInt(this.selectedBrick.dataset.lastX) || e.clientX;
            const lastY = parseInt(this.selectedBrick.dataset.lastY) || e.clientY;
            this.selectedBrick.dataset.lastX = e.clientX;
            this.selectedBrick.dataset.lastY = e.clientY;
            this.moveBrick(e.clientX - lastX, e.clientY - lastY);
        }
    }

    handleMouseDown = (e) => {
        if (this.preventMouse) {
            this.preventMouse = false;
            return;
        }

        switch(e.button) {
            case 0:
                if (this.selectedBrick) {
                    this.placeBrick();
                    e.preventDefault();
                } else {
                    const target = this.getParentBrickElement(e.target);
                    if (target) {
                        this.pickBrick(target);
                        e.preventDefault();
                    }
                }
                break;
            case 1:
                this.flipBrick();
                e.preventDefault();
                break;
            case 2:
                if (this.selectedBrick) {
                    this.resetBrick(this.selectedBrick);
                    e.preventDefault();
                } else {
                    const target = this.getParentBrickElement(e.target);
                    if (target) {
                        this.resetBrick(target);
                        e.preventDefault();
                    }
                }
                break;
        }
    }

    handleMouseWheel = (e) => {
        this.rotateBrick(Math.sign(e.deltaY));
    }

    handleKeyDown = (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                this.rotateBrick(-1);
                break;
            case 'ArrowRight':
                this.rotateBrick(1);
                break;
            case ' ':
                this.flipBrick();
                break;
            case 'Escape':
                if (this.selectedBrick) {
                    this.resetBrick(this.selectedBrick);
                    e.preventDefault();
                };
                break;
            return;
        }
    }
    
    handleResize = (e) => {
        // возвращаем на место кирпич который/если таскали
        this.resetBrick(this.selectedBrick);

        // обновляем константы сетки
        this.gridRect = this.container.getBoundingClientRect(); // получаем габариты контейнера
    }

    handleTimeChange(e) {
        const date = new Date(null);
        date.setSeconds(e);
        this.renderDisplay(date.toISOString().slice(11, 19));
    }

    handleBrickChange(e) {
        // Ищем соответствующий элемент кирпича, если нашли - перерисовываем
        const divBrick = this.getBrickElement(e.index);
        if (divBrick) this.renderBrick(divBrick, e.matrix, e.col, e.row);

        // Если поменялось положение кирпича на доске - сохраняем текущее состояние
        if ((typeof e.col === 'number') && (typeof e.row === 'number')) {
            const encodedString = this.game.saveGame();
            if (encodedString) localStorage.setItem(`game_state`, encodedString);
        }
    }

    handleBrickSelect(e) {
        const divBrick = this.getBrickElement(e);
        if (divBrick) this.startDrag(divBrick);
    }

    handleBrickDeselectHandler(e) {
        const divBrick = this.getBrickElement(e);
        if (divBrick) this.stopDrag(divBrick);
    }

    handleComletedChange(e) {
        if (e) {
            this.display.dataset.completed = true;
            this.playSound('soundCompleted');
        } else {
            delete this.display.dataset.completed;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});