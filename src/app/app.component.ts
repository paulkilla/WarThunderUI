// @ts-ignore
import {Component, OnInit} from '@angular/core';
import { WarthunderService } from '../app/warthunder.service';
// @ts-ignore
import {interval} from 'rxjs';
// @ts-ignore
import {MatDialog} from '@angular/material/dialog';

// @ts-ignore
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ WarthunderService ]
})

export class AppComponent implements OnInit {
  title = 'WarThunderUI';
  declare inGame: boolean;
  declare instruments: Instruments;
  declare gameChat: Message[];
  declare hudMessages: Message[];
  declare enemies: Enemies[];
  declare teamInstruments: Instruments[];
  declare teamPlayers: string[];
  constructor(private wtService: WarthunderService, public dialog: MatDialog) {
    this.gameChat = [];
    this.hudMessages = [];
    this.enemies = [];
    this.teamPlayers = [];
    this.inGame = false;
    this.teamInstruments = [];
    this.instruments = {
      playerName: localStorage.getItem('playerName') || '',
      altitude: 0,
      bearing: 0,
      bearing_text: '',
      climb_angle: 0,
      indicated_air_speed: 0,
      manifold_pressure: 0,
      pitch: 0,
      prop_pitch: 0,
      radiator: 0,
      throttle: 0,
      true_air_speed: 0,
      valid: false,
      vertical_speed: 0,
      water_temp: 0,
      oil_temp: 0,
      killed: false
    };
  }

  ngOnInit(): void {
    // Refresh HUD - State every 2 seconds
    interval(2000).subscribe((x: any) => {
      this.wtService.getState().subscribe(state => {
        // Assign variables in state to this.instruments
        for (const prop in state) {
          if (Object.prototype.hasOwnProperty.call(state, prop)) {
            // @ts-ignore
            this.instruments[prop] = state[prop];
          }
        }
      });
    });
    // Refresh HUD - Indicators every 2 seconds
    interval(2000).subscribe((x: any) => {
      this.wtService.getIndicators().subscribe(indicators => {
        if (indicators.bearing_text == null) {
          this.gameChat = [];
          this.enemies = [];
          this.inGame = false;
          this.teamPlayers = [];
          this.teamInstruments = [];
          this.hudMessages = [];
        } else {
          this.inGame = true;
        }
        // Assign variables in indicators to this.instruments
        for (const prop in indicators) {
          if (Object.prototype.hasOwnProperty.call(indicators, prop)) {
            // @ts-ignore
            this.instruments[prop] = indicators[prop];
          }
        }
      });
    });
    // Refresh GameChat - GameChat every 2 seconds
    interval(2000).subscribe((x: any) => {
      let latestId = 0;
      this.gameChat.forEach(item => {
        latestId = item.id;
      });
      this.wtService.getGameChat(latestId).subscribe(gameChat => gameChat.forEach((item: any) => {
        this.gameChat.push(item);
        const regexResult = item.msg.match('.*( )(.*)(\\(.*\\))!.*$');
        if ( regexResult != null ) {
          let exists = false;
          this.enemies.forEach(existingItem => {
            if (existingItem.name === regexResult[2]) {
              exists = true;
            }
          });
          if (!exists) {
            this.enemies.push({altitude: '', last_seen: '', name: regexResult[2], plane: regexResult[3], killed: false, location: ''});
          }
        }
      }));
    });
    // Refresh HudMsg - Get information on enemies destroyed and squad mates destroyed
    interval(2000).subscribe((x: any) => {
      const latestEvtId = 0;
      let latestDmgId = 0; // Not sure what this one does atm
      this.hudMessages.forEach(item => {
        latestDmgId = item.id;
      });
      this.wtService.getHudMessages(latestEvtId, latestDmgId).subscribe(hudMessages => hudMessages.forEach((item: any) => {
        this.hudMessages.push(item);
        // Do stuff here with the item and set enemies as dead etc.
        const regexResult = item.msg.match('(.*)(\\(.*\\))[\\s](.*)[\\s](.*)\\s(\\(.*\\)).*$');
        if ( regexResult != null ) {
          // Do stuff here when we match on the regex to pull down 'shot down'
          const action = regexResult[3];
          if (action != null) {
            if ( action.startsWith('shot down')) {
              const targetPlayerName = regexResult[4];
              // const sourcePlayerName = regexResult[1];
              if (targetPlayerName === this.instruments.playerName) {
                this.instruments.killed = true;
              }
              this.enemies.forEach((enemy: any) => {
                if (enemy.name === targetPlayerName) {
                  enemy.killed = true;
                }
              });
            }
          }
        }
      }));
    });
    // Upload Data to HerokuApp and pull data down
    interval(2000).subscribe((x: any) => {
      if (this.inGame) {
        const newTeamInstruments: Instruments[] = this.teamInstruments;
        let found = false;
        const playerName = localStorage.getItem('playerName');
        if (playerName !== null) {
          this.wtService.uploadData(playerName, this.instruments);
        }
        this.teamPlayers.forEach((player: any) => {
          this.wtService.pullPlayerData(player).subscribe(playerInstruments => {
            newTeamInstruments.forEach((instrument, index, theArray) => {
              if (instrument.playerName === player) {
                theArray[index] = playerInstruments;
                found = true;
              }
            });
            if (!found) {
              newTeamInstruments.push(playerInstruments);
            }
          });
        });
        this.teamInstruments = newTeamInstruments;
      }
    });
    // Get Player lists every 15 seconds (Gets all users if none have been specified)
    interval(15000).subscribe((x: any) => {
      if (this.inGame) {
        const squadMembers = localStorage.getItem('squadMembers');
        if (squadMembers !== null && squadMembers !== '') {
          this.teamPlayers = squadMembers.split(',');
        } else {
          this.wtService.getAllPlayers().subscribe(players => {
            this.teamPlayers = players;
          });
        }
      }
    });
  }
}

export interface Instruments {
  playerName: string;
  true_air_speed: number;
  indicated_air_speed: number;
  altitude: number;
  vertical_speed: number;
  pitch: number;
  throttle: number;
  climb_angle: number;
  radiator: number;
  valid: boolean;
  bearing: number;
  bearing_text: string;
  prop_pitch: number;
  manifold_pressure: number;
  oil_temp: number;
  water_temp: number;
  killed: boolean;
}

export interface Enemies {
  name: string;
  plane: string;
  location: string;
  altitude: string;
  last_seen: string;
  killed: boolean;
}

export interface Message {
  id: number;
  msg: string;
  sender: string;
  enemy: boolean;
  mode: string;
}
