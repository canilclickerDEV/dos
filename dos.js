class DesertOpsGame {
    constructor(faction, difficulty = 'normal') {
        this.faction = faction; // 'gdi' ou 'nod'
        this.difficulty = difficulty;
        this.isPaused = false;
        this.gameTime = 0;
        
        // Estado do jogo
        this.players = [
            {
                id: 'player',
                faction: faction,
                resources: {
                    crystals: 1000,
                    power: 100,
                    tiberium: faction === 'nod' ? 50 : 0
                },
                color: faction === 'gdi' ? '#2e86c1' : '#c0392b'
            },
            {
                id: 'enemy',
                faction: faction === 'gdi' ? 'nod' : 'gdi',
                resources: {
                    crystals: difficulty === 'easy' ? 800 : 
                             difficulty === 'hard' ? 1200 : 1000,
                    power: 100,
                    tiberium: faction === 'gdi' ? 50 : 0
                },
                color: faction === 'gdi' ? '#c0392b' : '#2e86c1'
            }
        ];
        
        // Entidades do jogo
        this.units = [];
        this.buildings = [];
        this.resources = [];
        
        // Controles
        this.selectedUnits = [];
        this.currentBuildType = null;
        
        // Configurações das facções
        this.config = {
            gdi: {
                units: {
                    miner: { cost: 400, health: 100, attack: 5, speed: 1, sprite: '🚜' },
                    grunt: { cost: 100, health: 50, attack: 15, speed: 3, sprite: '👮' },
                    medium_tank: { cost: 600, health: 200, attack: 45, speed: 2, sprite: '🚛' },
                    mammoth_tank: { cost: 1500, health: 500, attack: 80, speed: 1, sprite: '🚚' }
                },
                buildings: {
                    hq: { cost: 0, power: 0, health: 1000, sprite: '🏢' },
                    power_plant: { cost: 300, power: 100, health: 300, sprite: '⚡' },
                    refinery: { cost: 500, power: -25, health: 400, sprite: '⛽' },
                    barracks: { cost: 400, power: -20, health: 350, sprite: '🏠' },
                    war_factory: { cost: 800, power: -40, health: 500, sprite: '🏭' }
                }
            },
            nod: {
                units: {
                    harvester: { cost: 450, health: 100, attack: 5, speed: 1, sprite: '🚚' },
                    militant: { cost: 80, health: 40, attack: 12, speed: 3.5, sprite: '👤' },
                    light_tank: { cost: 550, health: 150, attack: 35, speed: 3, sprite: '🚗' },
                    flame_tank: { cost: 1200, health: 350, attack: 60, speed: 2, sprite: '🔥' }
                },
                buildings: {
                    hq: { cost: 0, power: 0, health: 1000, sprite: '🏢' },
                    power_plant: { cost: 300, power: 100, health: 300, sprite: '⚡' },
                    tiberium_silo: { cost: 350, power: -20, health: 350, sprite: '💎' },
                    refinery: { cost: 500, power: -25, health: 400, sprite: '⛽' },
                    barracks: { cost: 400, power: -20, health: 350, sprite: '🏠' },
                    war_factory: { cost: 800, power: -40, health: 500, sprite: '🏭' }
                }
            }
        };
        
        // Inicializações
        this.initGame();
        this.setupControls();
        this.gameLoop();
    }
    
    initGame() {
        // Cria base do jogador
        const player = this.getPlayer('player');
        const startX = 200;
        const startY = 200;
        
        // Cria HQ
        this.createBuilding('player', 'hq', startX, startY);
        
        // Cria unidade coletora inicial
        const collectorType = this.faction === 'gdi' ? 'miner' : 'harvester';
        this.createUnit('player', collectorType, startX + 50, startY + 50);
        
        // Cria power plant inicial
        this.createBuilding('player', 'power_plant', startX + 100, startY);
        
        // Cria base inimiga
        const enemy = this.getPlayer('enemy');
        const enemyX = 600;
        const enemyY = 600;
        
        this.createBuilding('enemy', 'hq', enemyX, enemyY);
        this.createUnit('enemy', 'grunt', enemyX + 50, enemyY + 50);
        this.createBuilding('enemy', 'power_plant', enemyX + 100, enemyY);
        
        // Cria recursos no mapa
        this.createResources();
        
        // Atualiza interface
        this.updateResourceDisplay();
        this.generateBuildButtons();
        
        this.addMessage('Base estabelecida. Inicie a construção!');
        this.addMessage('Missão: Destrua a base inimiga!');
    }
    
    createResources() {
        // Cria cristais pelo mapa
        const crystalCount = 15;
        
        for (let i = 0; i < crystalCount; i++) {
            this.resources.push({
                id: 'crystal_' + i,
                type: 'crystal',
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100,
                amount: 500
            });
        }
        
        // Cria tiberium para NOD
        const tiberiumCount = 10;
        
        for (let i = 0; i < tiberiumCount; i++) {
            this.resources.push({
                id: 'tiberium_' + i,
                type: 'tiberium',
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100,
                amount: 300
            });
        }
    }
    
    // CRIAÇÃO DE ENTIDADES
    createUnit(playerId, type, x, y) {
        const player = this.getPlayer(playerId);
        const config = this.config[player.faction].units[type];
        
        if (!config) {
            console.error('Tipo de unidade não encontrado:', type);
            return null;
        }
        
        if (playerId === 'player' && player.resources.crystals < config.cost) {
            this.addMessage('Cristais insuficientes para criar ' + type);
            return null;
        }
        
        // Gasta recursos (apenas para jogador)
        if (playerId === 'player') {
            player.resources.crystals -= config.cost;
            this.updateResourceDisplay();
        }
        
        const unit = {
            id: 'unit_' + Date.now() + '_' + Math.random(),
            playerId,
            type,
            x,
            y,
            health: config.health,
            maxHealth: config.health,
            attack: config.attack,
            speed: config.speed,
            sprite: config.sprite,
            target: null,
            moving: false,
            destination: { x, y },
            action: 'idle'
        };
        
        this.units.push(unit);
        
        if (playerId === 'player') {
            this.addMessage(`Unidade ${type} criada!`);
        }
        
        return unit;
    }
    
    createBuilding(playerId, type, x, y) {
        const player = this.getPlayer(playerId);
        const config = this.config[player.faction].buildings[type];
        
        if (!config) {
            console.error('Tipo de edifício não encontrado:', type);
            return null;
        }
        
        if (playerId === 'player') {
            // Verifica recursos
            if (player.resources.crystals < config.cost) {
                this.addMessage('Cristais insuficientes!');
                return null;
            }
            
            // Verifica energia
            if (config.power < 0 && this.getAvailablePower(playerId) < Math.abs(config.power)) {
                this.addMessage('Energia insuficiente!');
                return null;
            }
            
            // Gasta recursos
            player.resources.crystals -= config.cost;
            this.updateResourceDisplay();
        }
        
        const building = {
            id: 'building_' + Date.now() + '_' + Math.random(),
            playerId,
            type,
            x,
            y,
            health: config.health,
            maxHealth: config.health,
            sprite: config.sprite,
            powerOutput: config.power || 0
        };
        
        this.buildings.push(building);
        
        if (playerId === 'player') {
            this.addMessage(`Edifício ${type} construído!`);
        }
        
        return building;
    }
    
    // SISTEMA DE RECURSOS
    collectResource(unitId, resourceId) {
        const unit = this.units.find(u => u.id === unitId);
        const resource = this.resources.find(r => r.id === resourceId);
        
        if (!unit || !resource || unit.health <= 0) return;
        
        const player = this.getPlayer(unit.playerId);
        
        // Verifica se é uma unidade coletora
        const isCollector = unit.type === 'miner' || unit.type === 'harvester';
        if (!isCollector) return;
        
        // Coleta recurso
        const amount = 100;
        player.resources.crystals += amount;
        resource.amount -= amount;
        
        // Remove recurso se esgotado
        if (resource.amount <= 0) {
            this.resources = this.resources.filter(r => r.id !== resourceId);
        }
        
        this.updateResourceDisplay();
        
        if (unit.playerId === 'player') {
            this.addMessage(`+${amount} cristais coletados`);
        }
        
        // Faz a unidade retornar para base
        this.returnToBase(unit);
    }
    
    returnToBase(unit) {
        const player = this.getPlayer(unit.playerId);
        const hq = this.buildings.find(b => 
            b.playerId === unit.playerId && b.type === 'hq'
        );
        
        if (hq) {
            unit.moving = true;
            unit.destination = { x: hq.x + 50, y: hq.y + 50 };
        }
    }
    
    getAvailablePower(playerId) {
        let totalPower = 0;
        let consumedPower = 0;
        
        this.buildings.forEach(building => {
            if (building.playerId === playerId) {
                if (building.type === 'power_plant') {
                    totalPower += 100;
                } else {
                    const config = this.config[this.getPlayer(playerId).faction]
                        .buildings[building.type];
                    if (config && config.power < 0) {
                        consumedPower += Math.abs(config.power);
                    }
                }
            }
        });
        
        return totalPower - consumedPower;
    }
    
    // SISTEMA DE COMBATE
    attack(attackerId, targetId) {
        const attacker = this.units.find(u => u.id === attackerId);
        const target = this.units.find(u => u.id === targetId) || 
                      this.buildings.find(b => b.id === targetId);
        
        if (!attacker || !target || attacker.health <= 0) return;
        
        // Não atacar aliados
        if (attacker.playerId === target.playerId) return;
        
        // Calcula dano
        const damage = attacker.attack;
        target.health -= damage;
        
        // Atualiza alvo do atacante
        attacker.target = targetId;
        
        // Se o alvo foi destruído
        if (target.health <= 0) {
            this.destroyEntity(targetId);
            
            if (target.type === 'hq') {
                this.endGame(attacker.playerId === 'player' ? 'VITÓRIA' : 'DERROTA');
            }
            
            if (attacker.playerId === 'player') {
                this.addMessage(`Inimigo ${target.type} destruído!`);
            }
            
            attacker.target = null;
        }
    }
    
    destroyEntity(entityId) {
        // Remove de units ou buildings
        this.units = this.units.filter(u => u.id !== entityId);
        this.buildings = this.buildings.filter(b => b.id !== entityId);
        
        // Remove das seleções
        this.selectedUnits = this.selectedUnits.filter(id => id !== entityId);
        this.updateSelectedUnitsDisplay();
    }
    
    // CONTROLES DO JOGO
    setupControls() {
        const canvas = document.getElementById('gameCanvas');
        
        // Seleção de unidades
        canvas.addEventListener('click', (e) => {
            if (this.currentBuildType) return; // Em modo construção
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y, e.shiftKey);
        });
        
        // Movimento/ataque com botão direito
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleRightClick(x, y);
        });
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    handleClick(x, y, shiftKey = false) {
        // Converte coordenadas da tela para coordenadas do jogo
        const gameX = x; // Em um sistema real, ajustaria para a câmera
        const gameY = y;
        
        // Procura unidade clicada
        const clickedUnit = this.units.find(unit => {
            const distance = Math.sqrt(
                Math.pow(unit.x - gameX, 2) + 
                Math.pow(unit.y - gameY, 2)
            );
            return distance < 20 && unit.playerId === 'player';
        });
        
        if (clickedUnit) {
            if (shiftKey) {
                // Adiciona à seleção
                if (!this.selectedUnits.includes(clickedUnit.id)) {
                    this.selectedUnits.push(clickedUnit.id);
                }
            } else {
                // Nova seleção
                this.selectedUnits = [clickedUnit.id];
            }
            
            this.updateSelectedUnitsDisplay();
            this.updateUnitInfo(clickedUnit);
        } else if (this.currentBuildType) {
            // Modo construção
            this.buildAtPosition(gameX, gameY);
        } else {
            // Desseleciona tudo
            this.selectedUnits = [];
            this.updateSelectedUnitsDisplay();
        }
    }
    
    handleRightClick(x, y) {
        if (this.selectedUnits.length === 0) return;
        
        const gameX = x;
        const gameY = y;
        
        // Procura por inimigos no clique
        const enemyAtPosition = this.units.find(unit => 
            unit.playerId !== 'player' &&
            Math.sqrt(Math.pow(unit.x - gameX, 2) + Math.pow(unit.y - gameY, 2)) < 20
        ) || this.buildings.find(building => 
            building.playerId !== 'player' &&
            Math.sqrt(Math.pow(building.x - gameX, 2) + Math.pow(building.y - gameY, 2)) < 30
        );
        
        if (enemyAtPosition) {
            // Ataque
            this.selectedUnits.forEach(unitId => {
                this.attack(unitId, enemyAtPosition.id);
            });
            this.addMessage('Ataque ordenado!');
        } else {
            // Movimento
            this.selectedUnits.forEach(unitId => {
                const unit = this.units.find(u => u.id === unitId);
                if (unit) {
                    unit.moving = true;
                    unit.destination = { x: gameX, y: gameY };
                    unit.target = null;
                }
            });
            this.addMessage('Unidades em movimento!');
        }
    }
    
    handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case '1': case '2': case '3': case '4':
                // Grupos de controle (simplificado)
                this.addMessage(`Grupo ${e.key} selecionado`);
                break;
            case 'a':
                // Ataque móvel
                if (this.selectedUnits.length > 0) {
                    this.addMessage('Modo ataque móvel ativado');
                }
                break;
            case 'h':
                // Voltar para base
                this.selectedUnits.forEach(unitId => {
                    const unit = this.units.find(u => u.id === unitId);
                    if (unit) this.returnToBase(unit);
                });
                break;
            case ' ':
                // Pausa
                this.pauseGame();
                break;
            case 'b':
                // Menu construção
                this.toggleBuildMenu();
                break;
        }
    }
    
    // CONSTRUÇÃO
    buildAtPosition(x, y) {
        if (!this.currentBuildType) return;
        
        const success = this.createBuilding('player', this.currentBuildType, x, y);
        
        if (success) {
            this.currentBuildType = null;
            document.getElementById('gameCanvas').style.cursor = 'crosshair';
            this.addMessage('Construção concluída!');
        }
    }
    
    toggleBuildMenu() {
        // Alterna entre modos
        if (this.currentBuildType) {
            this.currentBuildType = null;
            document.getElementById('gameCanvas').style.cursor = 'crosshair';
        } else {
            // Mostra menu de construção
            this.addMessage('Selecione um edifício para construir');
        }
    }
    
    setBuildType(type) {
        this.currentBuildType = type;
        document.getElementById('gameCanvas').style.cursor = 'cell';
        this.addMessage(`Construindo ${type}. Clique no mapa.`);
    }
    
    // INTERFACE
    generateBuildButtons() {
        const container = document.getElementById('buildButtons');
        container.innerHTML = '';
        
        const player = this.getPlayer('player');
        const buildings = this.config[player.faction].buildings;
        
        Object.keys(buildings).forEach(buildingType => {
            if (buildingType === 'hq') return; // Não pode construir HQ
            
            const config = buildings[buildingType];
            const btn = document.createElement('button');
            btn.className = 'build-btn';
            btn.innerHTML = `${config.sprite} ${buildingType}<br>${config.cost}💎`;
            
            btn.onclick = () => {
                if (player.resources.crystals >= config.cost) {
                    this.setBuildType(buildingType);
                } else {
                    this.addMessage('Cristais insuficientes!');
                }
            };
            
            // Desabilita se não tem recursos
            if (player.resources.crystals < config.cost) {
                btn.disabled = true;
            }
            
            container.appendChild(btn);
        });
    }
    
    updateResourceDisplay() {
        const player = this.getPlayer('player');
        
        document.getElementById('crystalsCount').textContent = 
            Math.floor(player.resources.crystals);
        document.getElementById('powerCount').textContent = 
            `${this.getAvailablePower('player')}/100`;
        
        if (player.faction === 'nod') {
            document.getElementById('tiberiumCount').textContent = 
                player.resources.tiberium;
            document.getElementById('tiberiumCount').parentElement.style.display = 'flex';
        } else {
            document.getElementById('tiberiumCount').parentElement.style.display = 'none';
        }
        
        // Atualiza botões de construção
        this.generateBuildButtons();
    }
    
    updateSelectedUnitsDisplay() {
        const container = document.getElementById('selectedUnits');
        container.innerHTML = '';
        
        this.selectedUnits.forEach(unitId => {
            const unit = this.units.find(u => u.id === unitId);
            if (unit) {
                const portrait = document.createElement('div');
                portrait.className = `unit-portrait ${unit.playerId}`;
                portrait.textContent = unit.sprite;
                portrait.title = `${unit.type} (${unit.health}HP)`;
                container.appendChild(portrait);
            }
        });
    }
    
    updateUnitInfo(unit) {
        document.getElementById('selectedUnitName').textContent = 
            `${unit.type.toUpperCase()} - ${unit.health}HP`;
        
        const healthBar = document.getElementById('unitHealth');
        healthBar.innerHTML = `
            <div style="background: #e74c3c; width: 100px; height: 10px; border-radius: 5px;">
                <div style="background: #2ecc71; width: ${(unit.health/unit.maxHealth)*100}px; height: 10px; border-radius: 5px;"></div>
            </div>
            <small>ATK: ${unit.attack} | SPD: ${unit.speed}</small>
        `;
    }
    
    addMessage(text) {
        const container = document.getElementById('messagesList');
        const message = document.createElement('div');
        message.className = 'message';
        message.textContent = `[${this.formatTime()}] ${text}`;
        container.appendChild(message);
        
        // Scroll para baixo
        container.scrollTop = container.scrollHeight;
        
        // Limita número de mensagens
        if (container.children.length > 20) {
            container.removeChild(container.firstChild);
        }
    }
    
    formatTime() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // LOOP DO JOGO
    gameLoop() {
        if (this.isPaused) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // Atualiza tempo
        this.gameTime += 0.016; // ~60 FPS
        
        // Atualiza unidades
        this.updateUnits();
        
        // Atualiza IA inimiga
        this.updateEnemyAI();
        
        // Renderiza
        if (window.renderer) {
            window.renderer.render(this.units, this.buildings, this.resources, this.selectedUnits);
        }
        
        // Continua o loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateUnits() {
        this.units.forEach(unit => {
            // Movimento
            if (unit.moving && !unit.target) {
                const dx = unit.destination.x - unit.x;
                const dy = unit.destination.y - unit.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 2) {
                    unit.x += (dx / distance) * unit.speed;
                    unit.y += (dy / distance) * unit.speed;
                } else {
                    unit.moving = false;
                    
                    // Se for coletor e chegou em um recurso, coleta
                    if (unit.type === 'miner' || unit.type === 'harvester') {
                        const nearbyResource = this.findNearbyResource(unit);
                        if (nearbyResource) {
                            this.collectResource(unit.id, nearbyResource.id);
                        }
                    }
                }
            }
            
            // Ataque
            if (unit.target) {
                const target = this.units.find(u => u.id === unit.target) || 
                              this.buildings.find(b => b.id === unit.target);
                
                if (target && target.health > 0) {
                    const dx = target.x - unit.x;
                    const dy = target.y - unit.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 50) {
                        // Ataca a cada 1 segundo
                        if (this.gameTime % 1 < 0.016) {
                            this.attack(unit.id, unit.target);
                        }
                    } else {
                        // Move em direção ao alvo
                        unit.moving = true;
                        unit.destination = { x: target.x, y: target.y };
                    }
                } else {
                    unit.target = null;
                }
            }
        });
    }
    
    findNearbyResource(unit) {
        return this.resources.find(resource => {
            const distance = Math.sqrt(
                Math.pow(resource.x - unit.x, 2) + 
                Math.pow(resource.y - unit.y, 2)
            );
            return distance < 30;
        });
    }
    
    // IA INIMIGA (simples)
    updateEnemyAI() {
        // A cada 5 segundos
        if (this.gameTime % 5 < 0.016) {
            const enemy = this.getPlayer('enemy');
            
            // 30% de chance de criar uma unidade
            if (Math.random() < 0.3 && enemy.resources.crystals > 100) {
                const unitTypes = Object.keys(this.config[enemy.faction].units);
                const randomType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
                
                if (randomType !== 'miner' && randomType !== 'harvester') {
                    const hq = this.buildings.find(b => 
                        b.playerId === 'enemy' && b.type === 'hq'
                    );
                    
                    if (hq) {
                        this.createUnit('enemy', randomType, hq.x + 100, hq.y + 100);
                    }
                }
            }
            
            // 20% de chance de atacar
            if (Math.random() < 0.2) {
                const enemyUnits = this.units.filter(u => u.playerId === 'enemy');
                const playerUnits = this.units.filter(u => u.playerId === 'player');
                const playerBuildings = this.buildings.filter(b => b.playerId === 'player');
                
                if (enemyUnits.length > 0 && (playerUnits.length > 0 || playerBuildings.length > 0)) {
                    const randomEnemyUnit = enemyUnits[Math.floor(Math.random() * enemyUnits.length)];
                    
                    // Escolhe alvo aleatório
                    const allPlayerTargets = [...playerUnits, ...playerBuildings];
                    const randomTarget = allPlayerTargets[Math.floor(Math.random() * allPlayerTargets.length)];
                    
                    if (randomTarget) {
                        randomEnemyUnit.target = randomTarget.id;
                        randomEnemyUnit.moving = true;
                        randomEnemyUnit.destination = { 
                            x: randomTarget.x, 
                            y: randomTarget.y 
                        };
                    }
                }
            }
        }
    }
    
    // CONTROLES DO JOGO
    pauseGame() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            btn.textContent = '▶️ CONTINUAR';
            this.addMessage('Jogo pausado');
        } else {
            btn.textContent = '⏸️ PAUSAR';
            this.addMessage('Jogo continuado');
        }
    }
    
    saveGame() {
        const saveData = {
            faction: this.faction,
            difficulty: this.difficulty,
            gameTime: this.gameTime,
            player: this.getPlayer('player'),
            units: this.units,
            buildings: this.buildings,
            resources: this.resources
        };
        
        localStorage.setItem('desertOpsSave', JSON.stringify(saveData));
        this.addMessage('Jogo salvo!');
    }
    
    loadGame() {
        const saveData = JSON.parse(localStorage.getItem('desertOpsSave'));
        if (saveData) {
            // Implementar carregamento
            this.addMessage('Jogo carregado!');
        }
    }
    
    endGame(result) {
        this.isPaused = true;
        
        setTimeout(() => {
            if (confirm(`${result}! Deseja jogar novamente?`)) {
                location.reload();
            } else {
                location.href = 'index.html';
            }
        }, 1000);
    }
    
    // UTILIDADES
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }
}

// Torna acessível globalmente
window.DesertOpsGame = DesertOpsGame;