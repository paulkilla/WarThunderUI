import {Component, OnInit} from '@angular/core';
import { WarthunderService } from '../app/warthunder.service';
import { interval } from 'rxjs';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ WarthunderService ]
})

export class AppComponent implements OnInit {
  title = 'WarThunderUI';
  declare inGame: boolean;
  declare state: State;
  declare indicators: Indicators;
  declare gameChat: Message[];
  declare enemies: Enemies[];
  declare teamInstruments: TeamInstrument[];
  declare teamPlayers: string[];
  constructor(private wtService: WarthunderService, public dialog: MatDialog) {
    this.gameChat = [];
    this.enemies = [];
    this.teamPlayers = [];
    this.inGame = false;
    this.teamInstruments = [];
  }

  ngOnInit(): void {
    // Refresh HUD - State every 2 seconds
    interval(2000).subscribe(x => {
      this.wtService.getState().subscribe(state => this.state = state);
    });
    // Refresh HUD - Indicators every 2 seconds
    interval(2000).subscribe(x => {
      this.wtService.getIndicators().subscribe(indicators => {
        this.indicators = indicators;
        if (indicators.bearing == null) {
          this.gameChat = []; this.enemies = []; this.inGame = false; this.teamPlayers = []; this.teamInstruments = [];
        } else { this.inGame = true; }
      });
    });
    // Refresh GameChat - GameChat every 2 seconds
    interval(2000).subscribe(x => {
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
            this.enemies.push({name: regexResult[2], plane: regexResult[3]});
          }
        }
      }));
    });
    // Upload Data to HerokuApp and pull data down
    interval(2000).subscribe(x => {
      if (this.inGame) {
        const uploadObject = {...this.state, ...this.indicators};
        const newTeamInstruments: TeamInstrument[] = this.teamInstruments;
        let found = false;
        this.wtService.uploadData('paulkilla', uploadObject);
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
    // Get Player lists every 15 seconds
    interval(10000).subscribe(x => {
      if (this.inGame) {
        this.wtService.getAllPlayers().subscribe(players => {
          this.teamPlayers = players;
        });
      }
    });
  }
}

export interface TeamInstrument extends Indicators, State {
  playerName: string;
}

export interface Enemies {
  name: string;
  plane: string;
}

export interface State {
  true_air_speed: number;
  indicated_air_speed: number;
  altitude: number;
  vertical_speed: number;
  pitch: number;
  throttle: number;
  climb_angle: number;
  radiator: number;
  valid: boolean;
}

export interface Indicators {
  bearing: number;
  prop_pitch: number;
  manifold_pressure: number;
  valid: boolean;
}

export interface Message {
  id: number;
  msg: string;
  sender: string;
  enemy: boolean;
  mode: string;
}
