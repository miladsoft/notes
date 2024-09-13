import { Component } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NostrService } from 'src/app/services/nostr.service';
import { finalizeEvent, getEventHash, UnsignedEvent, Event } from 'nostr-tools';
import { User } from 'src/app/types/user';
import { webln } from "@getalby/sdk";
import { hexToBytes } from '@noble/hashes/utils';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {

  relays: string[];
  zap: string;
  blurChecked: any;
  debugProfileEvent: any;
  debugFollowingList: any;
  showDebugUI: boolean = false;

  constructor(
    private signerService: SignerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private nostrService: NostrService
  ) {
    this.relays = this.signerService.getRelays();
    console.log(this.relays);
    this.zap = this.signerService.getDefaultZap();
    let pubkey = this.signerService.getPublicKey();
    this.blurChecked = this.signerService.getBlurImagesIfNotFollowing();
    if (pubkey === "") {
      this.router.navigate(["/login"]);
    }
  }

  async saveRelays() {
    this.openSnackBar("Publishing profile and following list..", "dismiss");
    let kind0 = await this.nostrService.getUser(this.signerService.getPublicKey());
    if (kind0) {
      await this.publishSelfToNewRelays(kind0);
      await this.publishFollowingList(kind0);
      this.setRelay();
    } else {
      this.setRelay();
    }
  }

  async showDebug() {
    this.showDebugUI = !this.showDebugUI;
    const pubkey = this.signerService.getPublicKey();
    this.debugProfileEvent = await this.nostrService.getUser(pubkey);
    this.debugFollowingList = await this.nostrService.getFollowing(pubkey);
  }

  setBlurImages() {
    this.signerService.setBlurImagesIfNotFollowing(this.blurChecked);
  }

  setRelay() {
    this.signerService.setRelays(this.relays);
    this.openSnackBar("Relay Set!", "dismiss");
  }

  setZap() {
    this.signerService.setDefaultZap(this.zap);
    this.openSnackBar("Default Zap Set", "dismiss");
  }

  async nostrWalletConnect() {
    const nwc = webln.NostrWebLNProvider.withNewSecret();
    try {
      await nwc.initNWC({ name: 'notes' });
    } catch (e) {
      console.warn("Prompt closed");
      this.openSnackBar("Failed to connect Alby", "dismiss");
    }
    const url = nwc.getNostrWalletConnectUrl(true);
    this.signerService.setNostrWalletConnectURI(url);
    this.openSnackBar("Get Alby Wallet Connected!", "dismiss");
  }

  async publishSelfToNewRelays(kind0: User) {
    if (kind0) {
      let profile = {
        name: kind0.name,
        username: kind0.username,
        displayName: kind0.displayName,
        website: kind0.website,
        about: kind0.about,
        picture: kind0.picture,
        banner: kind0.banner,
        lud06: kind0.lud06,
        lud16: kind0.lud16,
        nip05: kind0.nip05
      };
      const content = JSON.stringify(profile);
      const privateKey = this.signerService.getPrivateKey();
      let unsignedEvent = this.getUnsignedEvent(0, [], content);
      let signedEvent: Event;
      if (privateKey !== "") {
        const privateKeyBytes = hexToBytes(privateKey);
        signedEvent = finalizeEvent(unsignedEvent, privateKeyBytes);
      } else {
        signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
      }
      this.nostrService.publishEventToPool(signedEvent);
    }
  }

  async publishFollowingList(user: User) {
    let tags: string[][] = this.signerService.getFollowingListAsTags();
    tags.push(["p", user.pubkey, "wss://relay.damus.io/", user.username]);
    let unsignedEvent = this.getUnsignedEvent(3, tags, "");
    let signedEvent: Event;
    const privateKey = this.signerService.getPrivateKey();
    if (privateKey !== "") {
      const privateKeyBytes = hexToBytes(privateKey);
      signedEvent = finalizeEvent(unsignedEvent, privateKeyBytes);
    } else {
      signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
    }
    this.nostrService.publishEventToPool(signedEvent);
  }

  getUnsignedEvent(kind: number, tags: any, content: string): UnsignedEvent {
    const eventUnsigned: UnsignedEvent = {
      kind: kind,
      pubkey: this.signerService.getPublicKey(),
      tags: tags,
      content: content,
      created_at: Math.floor(Date.now() / 1000),
    };
    return eventUnsigned;
  }

  signOut() {
    this.signerService.clearKeys();
    this.openSnackBar("Successfully signed out", "dismiss");
    this.router.navigate(["/login"]);
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, { duration: 1300 });
  }
}
