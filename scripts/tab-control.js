class TabControl {
    constructor(container, tabs = []) {
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        this.tabs = tabs;
        this.currentTabIndex = 0;
        
        this.render();
    }

    render() {
        // Создаем основную структуру
        this.container.innerHTML = '';
        this.container.className = 'tab-control';

        // Создаем заголовки вкладок
        const headersContainer = document.createElement('div');
        headersContainer.className = 'tab-headers';

        // Создаем область контента
        const contentArea = document.createElement('div');
        contentArea.className = 'tab-content-area';

        this.tabs.forEach((tab, index) => {
            // Создаем заголовок вкладки
            const header = document.createElement('button');
            header.className = `tab-header ${index === 0 ? 'active' : ''}`;
            header.type = 'button';

            // Добавляем глиф если есть
            if (tab.glyphSrc) {
                const glyph = document.createElement('img');
                glyph.className = 'tab-glyph';
                glyph.src = tab.glyphSrc;
                glyph.alt = '';
                header.appendChild(glyph);
            }

            // Добавляем текст
            const label = document.createElement('span');
            label.textContent = tab.label;
            header.appendChild(label);

            // Добавляем обработчик клика
            header.addEventListener('click', () => this.switchTab(index));

            headersContainer.appendChild(header);

            // Создаем контент вкладки
            const content = document.createElement('div');
            content.className = `tab-content ${index === 0 ? 'active' : ''}`;
            content.innerHTML = tab.content;
            contentArea.appendChild(content);
        });

        // Собираем все вместе
        this.container.appendChild(headersContainer);
        this.container.appendChild(contentArea);
    }

    switchTab(index) {
        if (index < 0 || index >= this.tabs.length || index === this.currentTabIndex) {
            return;
        }

        // Убираем активный класс со старой вкладки
        const oldHeader = this.container.querySelector('.tab-header.active');
        const oldContent = this.container.querySelector('.tab-content.active');
        
        if (oldHeader) oldHeader.classList.remove('active');
        if (oldContent) oldContent.classList.remove('active');

        // Добавляем активный класс к новой вкладке
        const newHeader = this.container.querySelectorAll('.tab-header')[index];
        const newContent = this.container.querySelectorAll('.tab-content')[index];
        
        if (newHeader) newHeader.classList.add('active');
        if (newContent) newContent.classList.add('active');

        this.currentTabIndex = index;
    }

    // Метод для добавления новой вкладки
    addTab(tab) {
        this.tabs.push(tab);
        this.render();
    }

    // Метод для удаления вкладки
    removeTab(index) {
        if (index >= 0 && index < this.tabs.length) {
            this.tabs.splice(index, 1);
            if (this.currentTabIndex >= this.tabs.length) {
                this.currentTabIndex = Math.max(0, this.tabs.length - 1);
            }
            this.render();
        }
    }

    // Метод для получения текущей активной вкладки
    getCurrentTab() {
        return this.tabs[this.currentTabIndex];
    }

    // Метод для получения индекса текущей вкладки
    getCurrentTabIndex() {
        return this.currentTabIndex;
    }
}