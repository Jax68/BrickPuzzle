class Dialog {
    constructor(title, buttons = [], destroyAfterUse = false) {
        this.title = title;
        this.buttons = buttons;
        this.container = document.createElement('div');
        this.overlay = document.createElement('div');
        this.formElements = new Map();
        this.destroyAfterUse = destroyAfterUse;
        
        this.init();
    }

    init() {
        this.createOverlay();
        this.createDialog();
        this.setupEventListeners();
    }

    createOverlay() {
        this.overlay.className = 'dialog-overlay';
        document.body.appendChild(this.overlay);
    }

    createDialog() {
        this.container.className = 'dialog-container';
        this.container.innerHTML = `
            <div class="dialog-header">
                <h2 class="dialog-title">${this.title}</h2>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content" id="dialogContent"></div>
            <div class="dialog-buttons"></div>
        `;

        this.createButtons();
        this.overlay.appendChild(this.container);
    }

    createButtons() {
        const buttonsContainer = this.container.querySelector('.dialog-buttons');
        
        this.buttons.forEach(buttonConfig => {
            const button = document.createElement('button');
            button.className = 'dialog-button';
            button.textContent = buttonConfig.label;
            button.type = 'button';
            
            button.addEventListener('click', () => {
                if (buttonConfig.handler) {
                    buttonConfig.handler(this);
                }
            });
            
            buttonsContainer.appendChild(button);
        });
    }

    setupEventListeners() {
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        const closeButton = this.container.querySelector('.dialog-close');
        closeButton.addEventListener('click', () => {
            this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    // Публичные методы для добавления элементов
    addInput(label, placeholder = '', value = '', readOnly = false, id = '') {
        const content = this.container.querySelector('#dialogContent');
        const elementId = id || `input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'form-label';
        labelEl.textContent = label;
        labelEl.htmlFor = elementId;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = elementId;
        input.className = 'form-input';
        input.placeholder = placeholder;
        input.value = value;
        input.readOnly = readOnly;
        input.addEventListener('contextmenu', (e) => {e.stopPropagation()});
        
        formGroup.appendChild(labelEl);
        formGroup.appendChild(input);
        content.appendChild(formGroup);
        
        this.formElements.set(elementId, input);
        return elementId;
    }

    addTextarea(label, placeholder = '', value = '', rows = 4, id = '') {
        const content = this.container.querySelector('#dialogContent');
        const elementId = id || `textarea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'form-label';
        labelEl.textContent = label;
        labelEl.htmlFor = elementId;
        
        const textarea = document.createElement('textarea');
        textarea.id = elementId;
        textarea.className = 'form-textarea';
        textarea.placeholder = placeholder;
        textarea.rows = rows;
        textarea.value = value;
        
        formGroup.appendChild(labelEl);
        formGroup.appendChild(textarea);
        content.appendChild(formGroup);
        
        this.formElements.set(elementId, textarea);
        return elementId;
    }

    addSelect(label, options = [], selectedValue = '', id = '') {
        const content = this.container.querySelector('#dialogContent');
        const elementId = id || `select_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'form-label';
        labelEl.textContent = label;
        labelEl.htmlFor = elementId;
        
        const select = document.createElement('select');
        select.id = elementId;
        select.className = 'form-select';
        
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            optionEl.selected = option.value === selectedValue;
            select.appendChild(optionEl);
        });
        
        formGroup.appendChild(labelEl);
        formGroup.appendChild(select);
        content.appendChild(formGroup);
        
        this.formElements.set(elementId, select);
        return elementId;
    }

    addCheckbox(label, checked = false, id = '') {
        const content = this.container.querySelector('#dialogContent');
        const elementId = id || `checkbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group checkbox-group';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'checkbox-label';
        labelEl.htmlFor = elementId;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = elementId;
        checkbox.className = 'form-checkbox';
        checkbox.checked = checked;
        
        const customCheckbox = document.createElement('span');
        customCheckbox.className = 'checkbox-custom';
        
        const labelText = document.createTextNode(label);
        
        labelEl.appendChild(checkbox);
        labelEl.appendChild(customCheckbox);
        labelEl.appendChild(labelText);
        formGroup.appendChild(labelEl);
        content.appendChild(formGroup);
        
        this.formElements.set(elementId, checkbox);
        return elementId;
    }

    addCustomHTML(html) {
        const content = this.container.querySelector('#dialogContent');
        
        // Для кастомного HTML всё равно используем innerHTML
        // но предупреждаем об опасности в документации
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        while (tempDiv.firstChild) {
            content.appendChild(tempDiv.firstChild);
        }
    }

    // Методы для работы с значениями

    getValue(elementId) {
        const element = this.formElements.get(elementId);
        if (!element) return null;
        
        if (element.type === 'checkbox') {
            return element.checked;
        }
        return element.value;
    }

    setValue(elementId, value) {
        const element = this.formElements.get(elementId);
        if (!element) return;
        
        if (element.type === 'checkbox') {
            element.checked = value;
        } else {
            element.value = value;
        }
    }

    // Управление диалогом

    show() {
        this.overlay.style.display = 'flex';
        setTimeout(() => {
            this.overlay.classList.add('active');
        }, 10);
    }

    destroy() {
        if (this.isClosed) return;
        
        this.isClosed = true;
        
        // Удаляем обработчики событий
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Удаляем элементы из DOM
        if (this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Очищаем ссылки
        this.formElements.clear();
        this.container = null;
        this.overlay = null;
    }

    close() {
        this.overlay.classList.remove('active');
        if (this.destroyAfterUse)
            setTimeout(() => {
                if (this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                };
            }, 300);
    }

    static create(title, buttons = []) {
        return new Dialog(title, buttons);
    }

    // ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:

    // showDialog1() {
    //     const dialog = new Dialog('Подтверждение действия', [
    //         {
    //             label: 'Отмена',
    //             handler: (dlg) => {
    //                 console.log('Диалог отменен');
    //                 dlg.close();
    //             }
    //         },
    //         {
    //             label: 'ОК',
    //             handler: (dlg) => {
    //                 console.log('Диалог подтвержден');
    //                 dlg.close();
    //             }
    //         }
    //     ]);
        
    //     dialog.show();        
    // }
    
    // showDialog2() {
    //     const dialog = new Dialog('Настройки игры', [
    //         {
    //             label: 'Отмена',
    //             handler: (dlg) => dlg.close()
    //         },
    //         {
    //             label: 'Сохранить',
    //             handler: (dlg) => {
    //                 const playerName = dlg.getValue('playerName');
    //                 const difficulty = dlg.getValue('difficulty');
    //                 const soundEnabled = dlg.getValue('soundEnabled');
                    
    //                 console.log('Сохранение настроек:', {
    //                     playerName,
    //                     difficulty,
    //                     soundEnabled
    //                 });
                    
    //                 dlg.close();
    //             }
    //         }
    //     ]);
        
    //     // Добавляем элементы формы
    //     dialog.addInput('Имя игрока', 'Введите ваше имя', 'Игрок');
    //     dialog.addSelect('Сложность', [
    //         { value: 'easy', label: 'Легкая' },
    //         { value: 'medium', label: 'Средняя' },
    //         { value: 'hard', label: 'Сложная' }
    //     ], 'medium');
    //     dialog.addCheckbox('Включить звук', true);
        
    //     dialog.show();        
    // }

}