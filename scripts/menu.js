class Menu {
    constructor(app) {
        this.app = app;
        this.container = document.createElement('div');
        this.container.className = 'menu-container';
        this.isMenuVisible = false;
        this.init();
    }

    init() {
        this.createMenuStructure();
        this.initMenuHandlers();
        this.loadCheckboxStates();
    }

    createMenuStructure() {
        // this.container.style.cssText = 'grid-area: 2 / 20 / 3 / 21; position: relative;';

        // Создаем кнопку меню
        const menuButton = document.createElement('button');
        menuButton.className = 'menu-button';
        menuButton.id = 'menuButton';
        menuButton.innerHTML = `
            <span></span>
        `;

        // Создаем выпадающее меню
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.id = 'dropdownMenu';
        dropdownMenu.innerHTML = `
            <div class="menu-header">
                <span class="menu-icon-small"></span>
                <span class="menu-title">BrickPuzzle 2025</span>
            </div>
            
            <div class="menu-item" data-action="restart">Начать заново</div>
            <div class="menu-separator"></div>
            
            <div class="menu-item" data-action="load">Загрузить</div>
            <div class="menu-item" data-action="save">Сохранить</div>
            <div class="menu-separator"></div>
            
            <div class="menu-item checkbox-item" data-action="sound">
                <span class="checkbox">✓</span>
                Включить звуки
            </div>
            <div class="menu-item checkbox-item" style="display:none" data-action="vibration">
                <span class="checkbox">✓</span>
                Включить вибрацию
            </div>
            <div class="menu-item checkbox-item" data-action="time">
                <span class="checkbox">✓</span>
                Отображать время
            </div>
            <div class="menu-separator"></div>
            
            <div class="menu-item" data-action="help">Справка</div>
        `;

        // Сохраняем ссылки на элементы
        this.menuButton = menuButton;
        this.dropdownMenu = dropdownMenu;
        
        // Собираем структуру
        this.container.appendChild(menuButton);
        this.container.appendChild(dropdownMenu);
    }

    initMenuHandlers() {
        // Открытие/закрытие меню
        this.menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.toggleMenu();
        });

        // Закрытие меню при клике вне его
        document.addEventListener('click', () => {
            this.hideMenu();
        });

        // Обработка кликов по пунктам меню
        const menuItems = this.dropdownMenu.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                const action = item.dataset.action;
                
                if (item.classList.contains('checkbox-item')) {
                    this.toggleCheckbox(item);
                } else {
                    this.handleMenuAction(action);
                    this.hideMenu();
                }
            });
        });

        // Предотвращаем закрытие меню при клике внутри него
        this.dropdownMenu.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    toggleMenu() {
        this.isMenuVisible = !this.isMenuVisible;
        this.dropdownMenu.classList.toggle('show', this.isMenuVisible);
    }

    showMenu() {
        this.isMenuVisible = true;
        this.dropdownMenu.classList.add('show');
    }

    hideMenu() {
        this.isMenuVisible = false;
        this.dropdownMenu.classList.remove('show');
    }

    toggleCheckbox(menuItem) {
        const checkbox = menuItem.querySelector('.checkbox');
        const isChecked = !checkbox.classList.contains('checked');
        
        checkbox.classList.toggle('checked', isChecked);
        
        const action = menuItem.dataset.action;
        this.saveCheckboxState(action, isChecked);
        this.handleCheckboxChange(action, isChecked);
    }

    saveCheckboxState(action, isChecked) {
        localStorage.setItem(`menu_${action}`, isChecked.toString());
    }

    loadCheckboxStates() {
        const checkboxes = ['sound', 'vibration', 'time'];
        checkboxes.forEach(action => {
            let isChecked = false;
            try {
                isChecked = localStorage.getItem(`menu_${action}`) === 'true';
            } finally {};
            const menuItem = this.dropdownMenu.querySelector(`[data-action="${action}"]`);
            if (menuItem) {
                const checkbox = menuItem.querySelector('.checkbox');
                checkbox.classList.toggle('checked', isChecked);
                this.handleCheckboxChange(action, isChecked);
            }
        });
    }

    handleMenuAction(action) {
        switch(action) {
            case 'restart':
                if (this.app.restartGame) this.app.restartGame();
                break;
            case 'load':
                if (this.app.loadGame) this.app.loadGame();
                break;
            case 'save':
                if (this.app.saveGame) this.app.saveGame();
                break;
            case 'help':
                if (this.app.showHelp) this.app.showHelp();
                break;
        }
    }

    handleCheckboxChange(action, isChecked) {
        switch(action) {
            case 'sound':
                if (this.app.toggleSound) this.app.toggleSound(isChecked);
                break;
            case 'vibration':
                if (this.app.toggleVibration) this.app.toggleVibration(isChecked);
                break;
            case 'time':
                if (this.app.toggleTimeDisplay) this.app.toggleTimeDisplay(isChecked);
                break;
        }
    }

    // Публичные методы для управления извне
    setCheckboxState(action, isChecked) {
        const menuItem = this.dropdownMenu.querySelector(`[data-action="${action}"]`);
        if (menuItem && menuItem.classList.contains('checkbox-item')) {
            const checkbox = menuItem.querySelector('.checkbox');
            checkbox.classList.toggle('checked', isChecked);
            this.saveCheckboxState(action, isChecked);
        }
    }

    getCheckboxState(action) {
        const menuItem = this.dropdownMenu.querySelector(`[data-action="${action}"]`);
        if (menuItem && menuItem.classList.contains('checkbox-item')) {
            const checkbox = menuItem.querySelector('.checkbox');
            return checkbox.classList.contains('checked');
        }
        return false;
    }
}