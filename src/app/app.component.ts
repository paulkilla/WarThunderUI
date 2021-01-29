// @ts-nocheck
import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import { } from 'jquery';
import {WarthunderService} from './warthunder.service';
import {environment} from '../environments/environment';
import {Instruments} from './instruments';
import {Message} from './message';
import {Enemy} from './enemy';
import {subscriptionLogsToBeFn} from 'rxjs/internal/testing/TestScheduler';
export const WS_SUB_ENDPOINT = environment.wsSubEndpoint;
export const WS_PUB_ENDPOINT = environment.wsPubEndpoint;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ WarthunderService ]
})

export class AppComponent implements OnInit, OnDestroy {

  messageFromServer: string;
  subService: WarthunderService;
  pubService: WarthunderService;
  subSubscription: Subscription;
  pubSubscription: Subscription;
  instruments: Instruments;
  gameChat: Message[];
  teamInstruments: Instruments[];
  enemies: Enemy[];
  pubStatus;
  subStatus;

  constructor(private subService: WarthunderService, private pubService: WarthunderService, private ngZone: NgZone) {
    this.subService = subService;
    this.pubService = pubService;
    window.restEndpoint = environment.restEndpoint;
  }

  ngOnInit(): void {
    window.initComponentReference = { component: this, zone: this.ngZone, loadAngularFunction: () => this.init(), };
  }

  init(): void {
    this.subSubscription =
      this.subService.createObservableSocket(WS_SUB_ENDPOINT)
        .subscribe(
          data => {
            console.log('Subscription: ' + data);
            this.messageFromServer = data;
            // Do stuff here when we receive other teammates data
           },
          err => console.log( 'sub err'),
          () =>  console.log( 'The observable sub stream is complete')
        );
    this.pubSubscription =
      this.pubService.createObservableSocket(WS_PUB_ENDPOINT)
        .subscribe(
          data => {
            console.log('Publishing: ' + data);
            this.messageFromServer = data;
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
    console.log('Registering Squad');
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

  monitorInstruments(): void {
    console.log('Monitoring our instruments and push to socket endpoint');

  }

  monitorGameChat(): void {
    console.log('Monitoring GameChat for enemy locations and storing game chat');

  }

  monitorGameLog(): void {
    console.log('Monitoring GameLog for awards, and deaths etc');

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
