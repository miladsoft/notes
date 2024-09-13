import { Component, OnInit, OnDestroy, ViewEncapsulation, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { NostrService } from 'src/app/services/nostr.service';
import { User } from "../../types/user";
import { finalizeEvent, getEventHash, Event, nip19, nip04, Filter, SimplePool, nip10 } from 'nostr-tools';
import { SignerService } from 'src/app/services/signer.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { distinctUntilChanged } from 'rxjs/operators';
import { Content } from 'src/app/types/post';
import { Router } from '@angular/router';
import { hexToBytes } from '@noble/hashes/utils';

interface Message {
    content: string;
    npub: string;
    createdAt: number;
}

@Component({
  selector: 'app-messenger',
  templateUrl: './messenger.component.html',
  styleUrls: ['./messenger.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class MessengerComponent implements OnInit, OnDestroy, AfterViewInit {
    pageLogs: string[] = [];
    contactSelected: boolean = false;
    friendNPub: string;
    myNPub: string;
    content: string = "";
    messages: Message[] = [];
    pubkeyTag: string = "#p";
    friend: User | undefined;
    me: User | undefined;
    userNotFound: boolean = false;
    smallScreen: boolean = false;
    Breakpoints = Breakpoints;
    currentBreakpoint: string = '';
    userPubkey: string;
    friendPubkey: string;
    userPrivateKey: string;
    fake: nip10.NIP10Result;
    pool: SimplePool;
    relay: WebSocket | null = null;
    readonly breakpoint$ = this.breakpointObserver
        .observe([Breakpoints.Large, Breakpoints.Medium, Breakpoints.Small, '(min-width: 500px)'])
        .pipe(distinctUntilChanged());

    constructor(
        private nostrService: NostrService,
        private signerService: SignerService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private breakpointObserver: BreakpointObserver,
        private cdRef: ChangeDetectorRef,
        private router: Router
    ) {
        this.fake = {
            reply: undefined,
            root: undefined,
            mentions: [],
            profiles: []
        };
        this.pool = new SimplePool();
        this.myNPub = this.signerService.npub();
        this.friendNPub = this.route.snapshot.paramMap.get('npub') || "";
        this.userPubkey = this.signerService.getPublicKey();
        this.friendPubkey = nip19.decode(this.friendNPub).data.toString();
        this.userPrivateKey = this.signerService.getPrivateKey();
        route.params.subscribe(val => {
            this.friendNPub = val["npub"];
            this.friendPubkey = nip19.decode(this.friendNPub).data.toString();
            this.getFriend();
            this.getMe();
            this.getMessages();
        });
    }

    ngOnInit(): void {
        this.breakpoint$.subscribe(() => {
            this.breakpointChanged();
        });
    }

    ngOnDestroy(): void {
        if (this.relay) {
            this.relay.close();
        }
    }

    ngAfterViewInit() {
        this.cdRef.detectChanges();
    }

    private breakpointChanged() {
        if(this.breakpointObserver.isMatched(Breakpoints.XLarge)) {
            this.currentBreakpoint = Breakpoints.Large;
            this.smallScreen = false;
        } else if(this.breakpointObserver.isMatched(Breakpoints.Large)) {
            this.currentBreakpoint = Breakpoints.Large;
            this.smallScreen = false;
        } else if(this.breakpointObserver.isMatched(Breakpoints.Medium)) {
            this.currentBreakpoint = Breakpoints.Medium;
            this.smallScreen = false;
        } else if(this.breakpointObserver.isMatched(Breakpoints.Small)) {
            this.currentBreakpoint = Breakpoints.Small;
            this.smallScreen = true;
        } else if(this.breakpointObserver.isMatched(Breakpoints.XSmall)) {
            this.currentBreakpoint = Breakpoints.XSmall;
            this.smallScreen = true;
        }
    }

    async getMe() {
        let user = await this.nostrService.getUser(this.signerService.getPublicKey());
        if (user) {
            this.me = user;
        }
    }

    async getFriend() {
        const pubkey: string = nip19.decode(this.friendNPub).data.toString();
        const filter: Filter = {authors: [pubkey], limit: 1};
        let users = await this.nostrService.getKind0(filter);
        if (users.length > 1) {
            this.friend = users[0];
        } else if (users.length === 0) {
            console.log("user not found");
        } else {
            this.friend = users[0];
        }
        if (!this.friend) {
            this.userNotFound = true;
        }
    }

    async getMessages() {
        let usToThem: Filter = {kinds: [4], authors: [this.userPubkey], "#p": [this.friendPubkey]};
        let themToUs: Filter = {kinds: [4], authors: [this.friendPubkey], "#p": [this.userPubkey]};
        let dmEvents: Event[] = await this.nostrService.getKind4(usToThem, themToUs);
        for (let dm of dmEvents) {
            this.addMessage(dm);
        }
        this.listenToRelay([usToThem, themToUs]);
    }

    async addMessage(dm: Event) {
        let decryptedContent;
        if (this.userPubkey === dm.pubkey) {
            decryptedContent = await this.decryptCipherText(dm.tags[0][1], dm.content);
        } else {
            decryptedContent = await this.decryptCipherText(dm.pubkey, dm.content);
        }
        this.messages.push({
            content: new Content(1, decryptedContent, this.fake).getParsedContent(),
            npub: nip19.npubEncode(dm.pubkey),
            createdAt: dm.created_at
        });
        this.messages.sort((a, b) => a.createdAt - b.createdAt);
    }
    async processLinks(e: any) {
      // needed when we generate html from incoming text to
      // route a link without getting a 404
      const element: HTMLElement = e.target;
      if (element.nodeName === 'A') {
          e.preventDefault();
          const link = element.getAttribute('href');
          if (link) {
              this.router.navigate([link]).catch((error) => {
                  window.open(link, "_blank");
              });
          }
      }
  }

    async listenToRelay(filters: Filter[]) {
        this.relay = await this.nostrService.relayConnect();
        if (this.relay) {
            const h = this.pool.subscribeMany([this.relay.url], filters, {
                onevent: (dm: Event) => {
                    this.addMessage(dm);
                },
                oneose: () => {
                    h.close();
                }
            });
        }
    }

    async encryptContent(pubkey: string, content: string) {
        if (this.signerService.usingNostrBrowserExtension()) {
            return this.signerService.signDMWithExtension(pubkey, content);
        }
        let privateKey = this.signerService.getPrivateKey();
        return nip04.encrypt(privateKey, pubkey, content);
    }

    async decryptCipherText(pubkey: string, content: string) {
        if (this.signerService.usingNostrBrowserExtension()) {
            return await this.signerService.decryptDMWithExtension(pubkey, content);
        }
        return this.signerService.decryptWithPrivateKey(pubkey, content);
    }

    openSnackBar(message: string, action: string) {
        this.snackBar.open(message, action, {duration: 1300});
    }

    async sendEvent() {
        const toFriendContent: string = await this.encryptContent(this.friendPubkey, this.content);
        const toTags = [["p", this.friendPubkey]];
        let toFriendUnsignedEvent = this.nostrService.getUnsignedEvent(4, toTags, toFriendContent);
        let toFriendSignedEvent: Event | null;
        if (this.userPrivateKey !== "") {
            const privateKeyBytes = hexToBytes(this.userPrivateKey);
            toFriendSignedEvent = finalizeEvent(toFriendUnsignedEvent, privateKeyBytes);
        } else {
            toFriendSignedEvent = await this.signerService.signEventWithExtension(toFriendUnsignedEvent);
        }
        if (toFriendSignedEvent) {
            this.nostrService.publishEventToPool(toFriendSignedEvent);
            this.openSnackBar("Message Sent!", "dismiss");
            this.content = "";
        } else {
            this.openSnackBar("Message Failed on signing!", "dismiss");
            this.content = "";
        }
    }
}
