import type * as Party from "partykit/server";

interface Player {
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number };
    health: number;
    maxHealth: number;
    kills: number;
    deaths: number;
    weapon: string;
    lastUpdate: number;
}

interface GameState {
    players: Record<string, Player>;
    matchStartTime: number;
    matchDuration: number; // 5 minutes in ms
    matchEnded: boolean;
    winner: string | null;
}

export default class GameServer implements Party.Server {
    constructor(readonly room: Party.Room) {}

    state: GameState = {
        players: {},
        matchStartTime: 0,
        matchDuration: 5 * 60 * 1000, // 5 minutes
        matchEnded: false,
        winner: null
    };

    lastTimerUpdate: number = 0;

    async onStart() {
        // Load state from storage
        const savedState = await this.room.storage.get<GameState>("gameState");
        if (savedState) {
            this.state = savedState;
        }
    }

    async saveState() {
        await this.room.storage.put("gameState", this.state);
    }

    onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        // Player connected, wait for join message with player data
        console.log(`Player connected: ${conn.id}`);
    }

    async onClose(conn: Party.Connection) {
        // Remove player from state
        const player = this.state.players[conn.id];
        if (player) {
            delete this.state.players[conn.id];
            // Broadcast player left
            this.room.broadcast(JSON.stringify({
                type: "player_left",
                playerId: conn.id,
                playerName: player.name
            }));
            await this.saveState();
        }

        // If no players left, reset match
        if (Object.keys(this.state.players).length === 0) {
            await this.resetMatch();
        }
    }

    async onMessage(message: string, sender: Party.Connection) {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case "join":
                    await this.handleJoin(sender, data);
                    break;
                case "position":
                    this.handlePosition(sender, data);
                    break;
                case "attack":
                    this.handleAttack(sender, data);
                    break;
                case "damage":
                    await this.handleDamage(sender, data);
                    break;
                case "respawn":
                    await this.handleRespawn(sender);
                    break;
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    }

    async handleJoin(conn: Party.Connection, data: any) {
        const player: Player = {
            id: conn.id,
            name: data.name || `Player_${conn.id.slice(0, 4)}`,
            position: { x: Math.random() * 40 - 20, y: 1.7, z: Math.random() * 40 - 20 },
            rotation: { x: 0, y: 0 },
            health: 100,
            maxHealth: 100,
            kills: 0,
            deaths: 0,
            weapon: data.weapon || "sword",
            lastUpdate: Date.now()
        };

        this.state.players[conn.id] = player;
        await this.saveState();

        // Start match if first player or match ended
        if (this.state.matchEnded || this.state.matchStartTime === 0) {
            await this.startMatch();
        }

        // Send current game state to joining player
        const playersArray = Object.values(this.state.players);
        conn.send(JSON.stringify({
            type: "game_state",
            playerId: conn.id,
            players: playersArray,
            matchStartTime: this.state.matchStartTime,
            matchDuration: this.state.matchDuration,
            timeRemaining: this.getTimeRemaining()
        }));

        // Broadcast new player to all others
        this.room.broadcast(JSON.stringify({
            type: "player_joined",
            player: player
        }), [conn.id]);
    }

    handlePosition(conn: Party.Connection, data: any) {
        const player = this.state.players[conn.id];
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.weapon = data.weapon || player.weapon;
            player.lastUpdate = Date.now();

            // Broadcast position to all other players
            this.room.broadcast(JSON.stringify({
                type: "player_position",
                playerId: conn.id,
                position: player.position,
                rotation: player.rotation,
                weapon: player.weapon,
                health: player.health
            }), [conn.id]);
        }
    }

    handleAttack(conn: Party.Connection, data: any) {
        // Broadcast attack animation to all players
        this.room.broadcast(JSON.stringify({
            type: "player_attack",
            playerId: conn.id,
            weapon: data.weapon,
            position: data.position,
            direction: data.direction
        }), [conn.id]);
    }

    async handleDamage(conn: Party.Connection, data: any) {
        const target = this.state.players[data.targetId];
        const attacker = this.state.players[conn.id];

        if (target && attacker && !this.state.matchEnded) {
            target.health -= data.damage;

            // Broadcast damage
            this.room.broadcast(JSON.stringify({
                type: "player_damaged",
                targetId: data.targetId,
                attackerId: conn.id,
                damage: data.damage,
                health: target.health
            }));

            // Check for kill
            if (target.health <= 0) {
                attacker.kills++;
                target.deaths++;
                target.health = 0;

                // Broadcast kill
                this.room.broadcast(JSON.stringify({
                    type: "player_killed",
                    targetId: data.targetId,
                    killerId: conn.id,
                    killerName: attacker.name,
                    targetName: target.name,
                    killerKills: attacker.kills
                }));
            }
            await this.saveState();
        }
    }

    async handleRespawn(conn: Party.Connection) {
        const player = this.state.players[conn.id];
        if (player) {
            player.health = player.maxHealth;
            player.position = {
                x: Math.random() * 40 - 20,
                y: 1.7,
                z: Math.random() * 40 - 20
            };

            // Broadcast respawn
            this.room.broadcast(JSON.stringify({
                type: "player_respawned",
                playerId: conn.id,
                position: player.position,
                health: player.health
            }));
            await this.saveState();
        }
    }

    async startMatch() {
        this.state.matchStartTime = Date.now();
        this.state.matchEnded = false;
        this.state.winner = null;

        // Reset all player stats
        Object.values(this.state.players).forEach(player => {
            player.kills = 0;
            player.deaths = 0;
            player.health = player.maxHealth;
        });

        // Start timer using alarm
        this.lastTimerUpdate = Date.now();
        await this.room.storage.setAlarm(Date.now() + 1000);
        await this.saveState();

        // Broadcast match start
        this.room.broadcast(JSON.stringify({
            type: "match_start",
            matchStartTime: this.state.matchStartTime,
            matchDuration: this.state.matchDuration
        }));
    }

    async onAlarm() {
        if (this.state.matchEnded) return;

        const timeRemaining = this.getTimeRemaining();
        const now = Date.now();

        // Broadcast time update every 10 seconds
        if (now - this.lastTimerUpdate >= 10000) {
            this.broadcastTimeUpdate();
            this.lastTimerUpdate = now;
        }

        // Check for match end
        if (timeRemaining <= 0) {
            await this.endMatch();
        } else {
            // Schedule next alarm in 1 second
            await this.room.storage.setAlarm(Date.now() + 1000);
        }
    }

    getTimeRemaining(): number {
        if (this.state.matchStartTime === 0) return this.state.matchDuration;
        return Math.max(0, this.state.matchDuration - (Date.now() - this.state.matchStartTime));
    }

    broadcastTimeUpdate() {
        this.room.broadcast(JSON.stringify({
            type: "time_update",
            timeRemaining: this.getTimeRemaining()
        }));
    }

    async endMatch() {
        if (this.state.matchEnded) return;

        this.state.matchEnded = true;

        // Delete the alarm to stop the timer
        await this.room.storage.deleteAlarm();

        // Find winner (most kills)
        let winner: Player | null = null;
        let maxKills = -1;

        const players = Object.values(this.state.players);
        for (const player of players) {
            if (player.kills > maxKills) {
                maxKills = player.kills;
                winner = player;
            }
        }

        this.state.winner = winner?.id || null;

        // Create scoreboard
        const scoreboard = Object.values(this.state.players)
            .map(p => ({
                id: p.id,
                name: p.name,
                kills: p.kills,
                deaths: p.deaths
            }))
            .sort((a, b) => b.kills - a.kills);

        await this.saveState();

        // Broadcast match end
        this.room.broadcast(JSON.stringify({
            type: "match_end",
            winnerId: this.state.winner,
            winnerName: winner?.name || "No one",
            winnerKills: maxKills,
            scoreboard: scoreboard,
            reward: 75 // Winner gets 75 coins
        }));
    }

    async resetMatch() {
        // Delete the alarm to stop any running timer
        await this.room.storage.deleteAlarm();

        this.state = {
            players: {},
            matchStartTime: 0,
            matchDuration: 5 * 60 * 1000,
            matchEnded: false,
            winner: null
        };
        this.lastTimerUpdate = 0;
        await this.saveState();
    }
}
