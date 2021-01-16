import {Component, OnInit} from '@angular/core';
import { WarthunderService } from '../app/warthunder.service';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
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
  declare image: string;
  declare state: State;
  declare indicators: Indicators;
  declare gameChat: Message[];
  declare enemies: Enemies[];
  constructor(private wtService: WarthunderService, public dialog: MatDialog) {
    this.gameChat = [];
    this.enemies = [];
  }

  ngOnInit(): void {
    // Refresh map every 30 seconds
    interval(30000).subscribe(x => {
      this.image = 'http://localhost:8111/map.img?cache=' + new Date().getTime();
    });
    // Refresh HUD - State every 2 seconds
    interval(2000).subscribe(x => {
      this.wtService.getState().subscribe(state => this.state = state);
    });
    // Refresh HUD - Indicators every 2 seconds
    interval(2000).subscribe(x => {
      this.wtService.getIndicators().subscribe(indicators => {
        this.indicators = indicators; if (indicators.bearing == null) { this.gameChat = []; this.enemies = []; }
      });
    });
    // Refresh GameChat - Indicators every 2 seconds
    interval(2000).subscribe(x => {
      let latestId = 0;
      this.gameChat.forEach(item => {
        latestId = item.id;
      });
      console.log(latestId);
      this.wtService.getGameChat(latestId).subscribe(gameChat => gameChat.forEach((item: any) => {
        const regexResult = item.msg.match('.*( )(.*)(\\(.*\\))!.*$');
        if ( regexResult != null ) {
          this.enemies.push({name: regexResult[2], plane: regexResult[3]});
        }
        this.gameChat.push(item);
      }));
    });
  }
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

export interface MapObjects {
  type: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  airfield_x: number;
  airfield_y: number;
  heading_x: number; // Maybe?
  heading_y: number; // Maybe?
}

export interface MissionObjectives {
  primary: boolean;
  status: string;
  text: string;
}

