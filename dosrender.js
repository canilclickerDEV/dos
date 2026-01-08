class GameRenderer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Cores
        this.colors = {
            gdi: '#2e86c1',
            nod: '#c0392b',
            neutral: '#7f8c8d',
            grid: 'rgba(255, 255, 255, 0.1)',
            selected: '#f1c40f',
            resource: '#9b59b6'
        };
        
        // Inicia renderização
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }
    
    render(units, buildings, resources, selectedUnits = []) {
        // Limpa canvas
        this.ctx.fillStyle = '#0c2461';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha grid
        this.drawGrid();
        
        // Desenha recursos
        resources.forEach(resource => {
            this.drawResource(resource);
        });
        
        // Desenha edifícios
        buildings.forEach(building => {
            this.drawBuilding(building);
        });
        
        // Desenha unidades
        units.forEach(unit => {
            this.drawUnit(unit, selectedUnits.includes(unit.id));
        });
        
        // Desenha HUD
        this.drawHUD();
    }
    
    drawGrid() {
        const gridSize = 50;
        
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawUnit(unit, isSelected = false) {
        const player = unit.playerId === 'player' ? 
            (window.game.faction === 'gdi' ? 'gdi' : 'nod') : 
            (window.game.faction === 'gdi' ? 'nod' : 'gdi');
        
        // Cor baseada na facção
        this.ctx.fillStyle = this.colors[player];
        
        // Desenha unidade (círculo)
        this.ctx.beginPath();
        this.ctx.arc(unit.x, unit.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Borda
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Ícone/Texto
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(unit.sprite, unit.x, unit.y);
        
        // Barra de vida
        if (unit.health < unit.maxHealth) {
            this.drawHealthBar(unit.x, unit.y - 25, unit.health, unit.maxHealth);
        }
        
        // Indicador de seleção
        if (isSelected) {
            this.ctx.strokeStyle = this.colors.selected;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(unit.x, unit.y, 20, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Indicador de movimento
        if (unit.moving) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.beginPath();
            this.ctx.moveTo(unit.x, unit.y);
            this.ctx.lineTo(unit.destination.x, unit.destination.y);
            this.ctx.stroke();
            
            // Destino
            this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(unit.destination.x, unit.destination.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBuilding(building) {
        const player = building.playerId === 'player' ? 
            (window.game.faction === 'gdi' ? 'gdi' : 'nod') : 
            (window.game.faction === 'gdi' ? 'nod' : 'gdi');
        
        // Cor baseada na facção
        this.ctx.fillStyle = this.colors[player];
        
        // Desenha edifício (retângulo)
        this.ctx.fillRect(building.x - 25, building.y - 25, 50, 50);
        
        // Borda
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(building.x - 25, building.y - 25, 50, 50);
        
        // Ícone/Texto
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(building.sprite, building.x, building.y);
        
        // Nome
        this.ctx.font = '10px Arial';
        this.ctx.fillText(building.type, building.x, building.y + 35);
        
        // Barra de vida
        this.drawHealthBar(building.x, building.y - 40, building.health, building.maxHealth, 40);
    }
    
    drawResource(resource) {
        // Cristal
        this.ctx.fillStyle = resource.type === 'crystal' ? '#9b59b6' : '#27ae60';
        
        this.ctx.beginPath();
        this.ctx.arc(resource.x, resource.y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Ícone
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(resource.type === 'crystal' ? '💎' : '🌿', resource.x, resource.y);
    }
    
    drawHealthBar(x, y, health, maxHealth, width = 30) {
        const healthPercent = health / maxHealth;
        
        // Fundo
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(x - width/2, y, width, 5);
        
        // Vida atual
        this.ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : 
                            healthPercent > 0.25 ? '#f39c12' : 
                            '#e74c3c';
        this.ctx.fillRect(x - width/2, y, width * healthPercent, 5);
        
        // Borda
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - width/2, y, width, 5);
    }
    
    drawHUD() {
        // Canto superior esquerdo - informações da facção
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        const faction = window.game.faction === 'gdi' ? 'GDI' : 'NOD';
        this.ctx.fillText(`Facção: ${faction}`, 20, 30);
        this.ctx.fillText(`Unidades: ${window.game.units.filter(u => u.playerId === 'player').length}`, 20, 50);
        this.ctx.fillText(`Edifícios: ${window.game.buildings.filter(b => b.playerId === 'player').length}`, 20, 70);
        
        // Modo construção
        if (window.game.currentBuildType) {
            this.ctx.fillStyle = 'rgba(243, 156, 18, 0.8)';
            this.ctx.fillRect(this.canvas.width/2 - 100, 10, 200, 40);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`CONSTRUINDO: ${window.game.currentBuildType.toUpperCase()}`, 
                this.canvas.width/2, 35);
        }
    }
}

// Inicializa o renderizador quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    window.renderer = new GameRenderer();
});