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
  totalAwards: number;
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
  isSiteActive;
  speedSetting;
  speedSettingMulti;
  altitudeSetting;
  altitudeSettingMulti;
  distanceSetting;
  distanceSettingMulti;
  climbSpeedSetting;
  climbSpeedSettingMulti;
  temperatureSetting;
  temperatureSettingMulti;

  constructor(private subService: SubscriptionService, private pubService: PublisherService, private wtService: WarthunderService,
              private ngZone: NgZone) {
    window.restEndpoint = environment.restEndpoint;
    window.isSiteActive = false;
    this.subService = subService;
    this.pubService = pubService;
    this.wtService = wtService;
    this.gameChat = [];
    this.hudMessages = [];
    this.instruments = new Instruments();
    this.enemies = [];
    this.teamInstruments = [];
    this.isSiteActive = false;
    this.totalAwards = 0;
    this.speedSetting = 'km/h';
    this.speedSettingMulti = 1;
    this.altitudeSetting = 'm';
    this.altitudeSettingMulti = 1;
    this.distanceSetting = 'km';
    this.distanceSettingMulti = 1;
    this.climbSpeedSetting = 'm/sec';
    this.climbSpeedSettingMulti = 1;
    this.temperatureSetting = 'C';
    this.temperatureSettingMulti = 1;
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
            if (message_type == null && data.message !== 'Squad joined') {
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
    this.configureSettingOptions();
    this.preloadMessages();
    this.isSiteActive = true; // Wanted to use these to stop unneeded calls, but hardcode till we can fix it
    window.isSiteActive = true; // Wanted to use these to stop unneeded calls, but hardcode till we can fix it
    this.monitorInstruments();
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

  configureSettingOptions(): void {
    this.speedSetting = localStorage.getItem('speedSetting');
    switch (this.speedSetting) {
      case 'mph':
        this.speedSettingMulti = 0.62137119223733;
        break;
      case 'kt':
        this.speedSettingMulti = 0.53995680346;
        break;
      default:
        this.speedSettingMulti = 1;
        break;
    }

    this.altitudeSetting = localStorage.getItem('altitudeSetting');
    switch (this.altitudeSetting) {
      case 'ft':
        this.altitudeSettingMulti = 3.28084;
        break;
      default:
        this.altitudeSettingMulti = 1;
        break;
    }

    this.distanceSetting = localStorage.getItem('distanceSetting');
    switch (this.distanceSetting) {
      case 'ft':
        this.distanceSettingMulti = 32.8084;
        break;
      case 'mi':
        this.distanceSettingMulti = 0.62137119223733;
        break;
      case 'yd':
        this.distanceSettingMulti = 1093.6132983;
        break;
      default:
        this.distanceSettingMulti = 1;
        break;
    }

    this.climbSpeedSetting = localStorage.getItem('climbSpeedSetting');
    switch (this.climbSpeedSetting) {
      case 'ft/min':
        this.climbSpeedSettingMulti = 3.2808399;
        break;
      default:
        this.climbSpeedSettingMulti = 1;
        break;
    }

    this.temperatureSetting = localStorage.getItem('temperatureSetting');
    switch (this.temperatureSetting) {
      case 'F':
        this.temperatureSettingMulti = 1.8;
        break;
      default:
        this.temperatureSettingMulti = 1;
        break;
    }
  }

  preloadMessages(): void {
    // Preload the Hud and Gamechat, so that we don't get stuff spamming on a reload
    this.wtService.getHudMessages(0, 0).subscribe(hudMessages => hudMessages.forEach((item: any) => {
      this.hudMessages.push(item);
    }));
    this.wtService.getGameChat(0).subscribe(gameChat => gameChat.forEach((item: any) => {
      this.gameChat.push(item);
    }));
    updateScroll();
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

  handleEnemyMessage(data): void {
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
    // Reset all the variables at the beginning of monitoring
    let iasSLArray: any[] = [];
    let tasSLArray: any[] = [];
    let altitudeSLArray: any[] = [];
    let throttleSLArray: any[] = [];
    let climbRateSLArray: any[] = [];
    let oilSLArray: any[] = [];
    let waterSLArray: any[] = [];
    let engineTempSLArray: any[] = [];
    $('#ias-trend-line').sparkline(iasSLArray);
    $('#tas-trend-line').sparkline(tasSLArray);
    $('#altitude-trend-line').sparkline(altitudeSLArray);
    $('#throttle-trend-line').sparkline(throttleSLArray);
    $('#climb-rate-trend-line').sparkline(climbRateSLArray);
    $('#oil-trend-line').sparkline(oilSLArray);
    $('#water-trend-line').sparkline(waterSLArray);
    $('#engine-temp-trend-line').sparkline(engineTempSLArray);

    interval(2100).subscribe((x: any) => {
      if (this.isSiteActive) {
        // Get State
        this.wtService.getState().subscribe(state => {
          for (const prop in state) {
            if (Object.prototype.hasOwnProperty.call(state, prop)) {
              this.instruments[prop] = state[prop];
              // Only update spark line when we are in a game, else reset them to 0
              if (this.inGame) {
                if (prop === 'ias') {
                  iasSLArray.push(state.ias);
                  $('#ias-trend-line').sparkline(iasSLArray);
                } else if (prop === 'tas') {
                  tasSLArray.push(state.tas);
                  $('#tas-trend-line').sparkline(tasSLArray);
                } else if (prop === 'altitude') {
                  altitudeSLArray.push(state.altitude);
                  $('#altitude-trend-line').sparkline(altitudeSLArray);
                } else if (prop === 'throttle') {
                  throttleSLArray.push(state.throttle);
                  $('#throttle-trend-line').sparkline(throttleSLArray);
                } else if (prop === 'verticalSpeed') {
                  climbRateSLArray.push(state.verticalSpeed);
                  $('#climb-rate-trend-line').sparkline(climbRateSLArray);
                } else if (prop === 'oilTemp') {
                  oilSLArray.push(state.oilTemp);
                  $('#oil-trend-line').sparkline(oilSLArray);
                } else if (prop === 'waterTemp') {
                  waterSLArray.push(state.waterTemp);
                  $('#water-trend-line').sparkline(waterSLArray);
                } else if (prop === 'engineTemp') {
                  engineTempSLArray.push(indicators.engineTemp);
                  $('#engine-temp-trend-line').sparkline(engineTempSLArray);
                }
              }
            }
          }
        });
        // Get Indicators
        this.wtService.getIndicators().subscribe(indicators => {
          if (this.isSiteActive) {
            if (indicators == null || indicators.valid == null || !indicators.valid) {
              this.inGame = false;
              // Append here if you want it to reset immediately when a game ends.
            } else {
              if (!this.inGame) {
                // Append here if you want it to reset when you start a new game.
                iasSLArray = [0];
                tasSLArray = [0];
                altitudeSLArray = [0];
                throttleSLArray = [0];
                climbRateSLArray = [0];
                oilSLArray = [0];
                waterSLArray = [0];
                engineTempSLArray = [0];
                this.totalAwards = 0;
                this.gameChat = [];
                this.enemies = [];
                this.instruments.killed = false;
              }
              this.inGame = true;
            }
            // Assign variables in indicators to this.instruments
            for (const prop in indicators) {
              if (Object.prototype.hasOwnProperty.call(indicators, prop)) {
                this.instruments[prop] = indicators[prop];
                if (prop === 'engineTemp') {
                  engineTempSLArray.push(indicators.engineTemp);
                  $('#engine-temp-trend-line').sparkline(engineTempSLArray);
                }
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
          }
        });
        // Monitor Game chat
        let latestId = 0;
        this.gameChat.forEach(item => {
          latestId = item.id;
        });
        this.wtService.getGameChat(latestId).subscribe(gameChat => gameChat.forEach((item: any) => {
          this.gameChat.push(item);
          updateScroll();
          const myLocationResult = item.msg.match('.*( )(.*)(\\(.*\\))!.*$');
          const teamLocationResult = item.msg.match('(.*)\\s+(.*)(\\(.*\\))![<]\\bcolor(.*)[>]\\s\\[(.*)\\][<][/]\\bcolor\\b[>]$');
          if ( myLocationResult != null || teamLocationResult != null ) {
            let lastLocation = 'Unknown';
            const lastSeen = new Date().getTime();
            let playerName = '';
            let playerPlane = '';
            if (myLocationResult != null) {
              playerName = myLocationResult[2];
              playerPlane = myLocationResult[3];
            }
            if (teamLocationResult != null) {
              playerName = teamLocationResult[2];
              playerPlane = teamLocationResult[3];
              lastLocation = teamLocationResult[5];
            }
            let data: {};
            if (lastLocation === 'Unknown') {
              data = {altitude: 0, lastSeen, name: playerName, plane: playerPlane, killed: false,
                location: lastLocation};
            } else {
              // Get last Location and altitude out of lastLocation field and store separately as m (even if using ft)
              const locationRegexResult = lastLocation.match('(.*)\\b, alt\\b\\.\\s(.*)\\s(.*)');
              const gridRef = locationRegexResult[1];
              let altitude = locationRegexResult[2];
              const altitudeType = locationRegexResult[3];
              if (altitudeType === 'ft') {
                // tslint:disable-next-line:radix
                altitude = (parseInt(altitude) / 3.2808);
              }
              data = {altitude, lastSeen, name: playerName, plane: playerPlane, killed: false,
                location: gridRef};
            }
            this.pubStatus = this.pubService.sendMessage(JSON.stringify({
              message_type: 'enemy',
              player: playerName,
              data
            }));
          }
        }));
      }
    });
  }

  monitorGameLog(): void {
    interval(5000).subscribe((x: any) => {
      if (this.isSiteActive) {
        const latestEvtId = 0; // Not sure what this one does atm
        let latestDmgId = 0;
        this.hudMessages.forEach(item => {
          latestDmgId = item.id;
        });
        this.wtService.getHudMessages(latestEvtId, latestDmgId).subscribe(hudMessages => hudMessages.forEach((item: any) => {
          this.hudMessages.push(item);
          // Do stuff here with the item and set enemies as dead etc.
          // Match for awards
          const awardsResult = item.msg.match('(.*)\\s(\\(.*\\))\\s\\bhas achieved\\b\\s(.*)$');
          if ( awardsResult != null ) {
            const player = awardsResult[1];
            const award = awardsResult[3];
            if (existsInArray(this.teamInstruments, 'playerName', player) || player === localStorage.getItem('playerName')) {
              showNotification('top', 'left', player + ' got the award ' + award, 'warning', 3000, false);
              this.totalAwards = this.totalAwards + 1;
            }
          } else {
            // TODO: Figure out shot down with the 'using a controller' people, and any other that pop up.
            const disconnectResult = item.msg.match('(.*)[td!]\\s\\bkd\\?NET_PLAYER_DISCONNECT_FROM_GAME\\b$');
            let targetPlayerName = null;
            if (disconnectResult != null) {
              targetPlayerName = disconnectResult[1];
            } else {
              const crashedResult = item.msg.match('\\s?(.*) (\\(.*\\))(.*)[ has crashed.]$');
              if (crashedResult != null) {
                targetPlayerName = crashedResult[1];
              } else {
                const aaaResult = item.msg.match('\\bAAA shot down\\b\\s(.*)\\s(\\(.*\\))$');
                if (aaaResult != null) {
                  targetPlayerName = aaaResult[1];
                } else {
                  const regexResult = item.msg.match('(.*)(\\(.*\\))[\\s](.*)[\\s](.*)\\s(\\(.*\\)).*$');
                  if (regexResult != null) {
                    const action = regexResult[3];
                    if (action != null) {
                      if (action.startsWith('shot down')) {
                        targetPlayerName = regexResult[4];
                      }
                    }
                  }
                }
              }
            }
            if (targetPlayerName != null && targetPlayerName === this.instruments.playerName) {
              this.instruments.killed = true;
            } else if (targetPlayerName != null) {
              this.enemies.forEach((enemy: any) => {
                if (enemy.name === targetPlayerName) {
                  enemy.killed = true;
                }
              });
            }
          }
        }));
      }
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

  formatNan(theNumber): number {
    if (theNumber !== theNumber) {
      return 0;
    }
    return theNumber;
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
  $('.game-chat').each(function(): void {
    $(this).animate({ scrollTop: $(this).prop('scrollHeight')}, 1000);
  });
}
