// @ts-nocheck
import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import { } from 'jquery';
import {WarthunderService} from './warthunder.service';
import {environment} from '../environments/environment';
import {Instruments} from './instruments';
import {Message} from './message';
import {Enemy} from './enemy';
import {SubscriptionService} from './subscription.service';
import {PublisherService} from './publisher.service';
export const WS_SUB_ENDPOINT = environment.wsSubEndpoint;
export const WS_PUB_ENDPOINT = environment.wsPubEndpoint;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ WarthunderService ]
})

export class AppComponent implements OnInit, OnDestroy {
  inGame: true;
  publishResponse: string;
  subService: SubscriptionService;
  pubService: PublisherService;
  wtService: WarthunderService;
  subSubscription: Subscription;
  pubSubscription: Subscription;
  instruments: Instruments;
  gameChat: Message[];
  hudMessages: Message[];
  teamInstruments: Instruments[];
  enemies: Enemy[];
  pubStatus;
  subStatus;

  constructor(private subService: SubscriptionService, private pubService: PublisherService, private wtService: WarthunderService,
              private ngZone: NgZone) {
    window.restEndpoint = environment.restEndpoint;
    this.subService = subService;
    this.pubService = pubService;
    this.wtService = wtService;
    this.gameChat = [];
    this.hudMessages = [];
    this.instruments = new Instruments();
    this.enemies = [];
    this.teamInstruments = [];
  }

  ngOnInit(): void {
    window.initComponentReference = { component: this, zone: this.ngZone, loadAngularFunction: () => this.init(), };
  }

  init(): void {
    this.subSubscription =
      this.subService.createObservableSocket(WS_SUB_ENDPOINT)
        .subscribe(
        rawData => {
            const data = JSON.parse(rawData);
            const message_type = data.message_type;
            if (message_type == null) {
              console.log('Data has no message type: ' + JSON.stringify(data));
            } else {
              if (message_type === 'squadmate') {
                this.handleSquadMateMessage(data);
              } else if (message_type === 'enemy') {
                this.handleEnemyMessage(data);
              }
              // When we get new message types, add handlers here
            }
           },
          err => console.log( 'sub err'),
          () =>  console.log( 'The observable sub stream is complete')
        );
    this.pubSubscription =
      this.pubService.createObservableSocket(WS_PUB_ENDPOINT)
        .subscribe(
          data => {
            this.publishResponse = data;
          },
          err => console.log( 'pub err'),
          () =>  console.log( 'The observable pub stream is complete')
        );
    this.registerWithSquad();
    this.monitorInstruments();
    this.monitorGameChat();
    this.monitorGameLog();
  }

  registerWithSquad(): void {
    this.pubService.socket.onopen = (): void => {
      this.pubStatus = this.pubService.sendMessage(JSON.stringify({
        message_type: 'join',
        data: {
          name: localStorage.getItem('squadName'),
          secret: localStorage.getItem('squadSecret')
        }
      }));
    };
    this.subService.socket.onopen = (): void => {
      this.subStatus = this.subService.sendMessage(JSON.stringify({
        message_type: 'join',
        data: {
          name: localStorage.getItem('squadName'),
          secret: localStorage.getItem('squadSecret')
        }
      }));
    };
  }

  handleSquadMateMessage(data): void {
    if (data.player !== localStorage.getItem('playerName') ||
      (localStorage.getItem('showMyInstruments') === 'true' && data.player === localStorage.getItem('playerName'))) {
      if (existsInArray(this.teamInstruments, 'playerName', data.player)) {
        this.teamInstruments.forEach((instrument, index) => {
          if (instrument.playerName === data.player) {
            this.teamInstruments[index] = data.data;
          }
        });
      } else {
        this.teamInstruments.push(data.data);
        if (data.player !== localStorage.getItem('playerName')) {
          showNotification('top', 'right', data.player + ' joined your squad!', 'success', 3000, false);
        }
      }
    } else if (existsInArray(this.teamInstruments, 'playerName', data.player)) {
      this.teamInstruments.forEach((instrument, index) => {
        this.teamInstruments.splice(index, 1);
      });
    }
  }

  handleEnemyMessage(data): void {c
    if (existsInArray(this.enemies, 'name', data.player)) {
      this.enemies.forEach((enemy, index) => {
        if (enemy.name === data.player) {
          if (data.data.location !== 'Unknown') {
            this.enemies[index] = data.data;
          }
        }
      });
    } else {
      this.enemies.push(data.data);
    }
  }

  monitorInstruments(): void {
    // Reset all the variables
    let iasSLArray: any[] = [];
    let altitudeSLArray: any[] = [];
    let throttleSLArray: any[] = [];
    let climbRateSLArray: any[] = [];
    let climbAngleSLArray: any[] = [];
    let oilSLArray: any[] = [];
    let waterSLArray: any[] = [];
    $('#ias-trend-line').sparkline(iasSLArray);
    $('#altitude-trend-line').sparkline(altitudeSLArray);
    $('#throttle-trend-line').sparkline(throttleSLArray);
    $('#climb-rate-trend-line').sparkline(climbRateSLArray);
    $('#climb-angle-trend-line').sparkline(climbAngleSLArray);
    $('#oil-trend-line').sparkline(oilSLArray);
    $('#water-trend-line').sparkline(waterSLArray);

    interval(2000).subscribe((x: any) => {
      this.wtService.getState().subscribe(state => {
        // Assign variables in state to this.instruments
        for (const prop in state) {
          if (Object.prototype.hasOwnProperty.call(state, prop)) {
            this.instruments[prop] = state[prop];
            // Only update spark line when we are in a game, else reset them to 0
            if (this.inGame) {
              if (prop === 'ias') {
                iasSLArray.push(state.ias);
                $('#ias-trend-line').sparkline(iasSLArray);
              } else if (prop === 'altitude') {
                altitudeSLArray.push(state.altitude);
                $('#altitude-trend-line').sparkline(altitudeSLArray);
              } else if (prop === 'throttle') {
                throttleSLArray.push(state.throttle);
                $('#throttle-trend-line').sparkline(throttleSLArray);
              } else if (prop === 'verticalSpeed') {
                climbRateSLArray.push(state.verticleSpeed);
                $('#climb-rate-trend-line').sparkline(climbRateSLArray);
              } else if (prop === 'climbAngle') {
                climbAngleSLArray.push(state.climbAngle);
                $('#climb-angle-trend-line').sparkline(climbAngleSLArray);
              } else if (prop === 'oilTemp') {
                oilSLArray.push(state.oilTemp);
                $('#oil-trend-line').sparkline(oilSLArray);
              } else if (prop === 'waterTemp') {
                waterSLArray.push(state.waterTemp);
                $('#water-trend-line').sparkline(waterSLArray);
              }
            } else {
              iasSLArray = [0];
              altitudeSLArray = [0];
              throttleSLArray = [0];
              climbRateSLArray = [0];
              climbAngleSLArray = [0];
              oilSLArray = [0];
              waterSLArray = [0];
            }
          }
        }
      });
    });
    interval(2000).subscribe((x: any) => {
      this.wtService.getIndicators().subscribe(indicators => {
        if (indicators == null || indicators.valid == null || !indicators.valid) {
          this.gameChat = [];
          this.enemies = [];
          this.inGame = false;
          this.teamInstruments.forEach(instrument => {
            instrument.killed = false;
          });
        } else {
          this.inGame = true;
        }
        // Assign variables in indicators to this.instruments
        for (const prop in indicators) {
          if (Object.prototype.hasOwnProperty.call(indicators, prop)) {
            this.instruments[prop] = indicators[prop];
          }
        }

        if (this.inGame) {
          this.instruments.playerName = localStorage.getItem('playerName');
          this.pubStatus = this.pubService.sendMessage(JSON.stringify({
            message_type: 'squadmate',
            player: localStorage.getItem('playerName'),
            data: this.instruments
          }));
        }
      });
    });
  }

  monitorGameChat(): void {
    interval(2000).subscribe((x: any) => {
      let latestId = 0;
      this.gameChat.forEach(item => {
        latestId = item.id;
      });
      this.wtService.getGameChat(latestId).subscribe(gameChat => gameChat.forEach((item: any) => {
        this.gameChat.push(item);
        updateScroll();
        const myRegexResult = item.msg.match('.*( )(.*)(\\(.*\\))!.*$');
        const otherRegexResult = item.msg.match('(.*)\\s+(.*)(\\(.*\\))![<]\\bcolor(.*)[>]\\s\\[(.*)\\][<][/]\\bcolor\\b[>]$');
        if ( myRegexResult != null || otherRegexResult != null ) {
          let lastLocation = 'Unknown';
          const lastSeen = new Date().getTime();
          let playerName = '';
          let playerPlane = '';
          if (myRegexResult != null) {
            playerName = myRegexResult[2];
            playerPlane = myRegexResult[3];
          }
          if (otherRegexResult != null) {
            playerName = otherRegexResult[2];
            playerPlane = otherRegexResult[3];
            lastLocation = otherRegexResult[5];
          }
          this.pubStatus = this.pubService.sendMessage(JSON.stringify({
            message_type: 'enemy',
            player: playerName,
            data: {altitude: '', lastSeen, name: playerName, plane: playerPlane, killed: false,
              location: lastLocation}
          }));
        }
      }));
    });
  }

  monitorGameLog(): void {
    interval(2000).subscribe((x: any) => {
      const latestEvtId = 0;
      let latestDmgId = 0; // Not sure what this one does atm
      this.hudMessages.forEach(item => {
        latestDmgId = item.id;
      });
      this.wtService.getHudMessages(latestEvtId, latestDmgId).subscribe(hudMessages => hudMessages.forEach((item: any) => {
        this.hudMessages.push(item);
        // Do stuff here with the item and set enemies as dead etc.
        let regexResult = item.msg.match('(.*)(\\(.*\\))[\\s](.*)[\\s](.*)\\s(\\(.*\\)).*$');
        if ( regexResult != null ) {
          // Do stuff here when we match on the regex to pull down 'shot down'
          const action = regexResult[3];
          if (action != null) {
            if ( action.startsWith('shot down')) {
              const targetPlayerName = regexResult[4];
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
        } else {
          // Check for other regex.
          // Check for crashes.. hah what a noob!
          regexResult = item.msg.match('[\\s?](.*) (\\(.*\\))(.*)[ has crashed.]$');
          if ( regexResult != null ) {
            const targetPlayerName = regexResult[1];
            if (targetPlayerName === this.instruments.playerName) {
              this.instruments.killed = true;
            }
            this.enemies.forEach((enemy: any) => {
              if (enemy.name === targetPlayerName) {
                enemy.killed = true;
              }
            });
          } else {
            // check for aaa kill
            regexResult = item.msg.match('\\bAAA shot down\\b\\s(.*)\\s(\\(.*\\))$');
            if ( regexResult != null ) {
              const targetPlayerName = regexResult[1];
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
          // Match for Awards
          regexResult = item.msg.match('(.*)\\s(\\(.*\\))\\s\\bhas achieved\\b\\s(.*)$');
          if ( regexResult != null ) {
            const player = regexResult[1];
            const award = regexResult[3];
            if (existsInArray(this.teamInstruments, 'playerName', player) || player === localStorage.getItem('playerName')) {
              showNotification('top', 'left', player + ' got the award ' + award, 'warning', 3000, false);
            }
          }
        }
      }));
    });
  }

  closeSocket(): void {
    this.subSubscription.unsubscribe();
    this.subStatus = 'The socket is closed';
    this.pubSubscription.unsubscribe();
    this.pubStatus = 'The socket is closed';
  }

  ngOnDestroy(): void {
    this.closeSocket();
  }
}

function existsInArray(array, field, value): boolean {
  let found = false;
  for (const item of array) {
    if (item[field] === value) {
      found = true;
      break;
    }
  }
  return found;
}

function updateScroll(): void {
  const element = $('.game-chat').each(function(): void {
    $(this).animate({ scrollTop: $(this).prop('scrollHeight')}, 1000);
  });
}
