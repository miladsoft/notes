import { Component } from '@angular/core';
import { generateSecretKey, getPublicKey, nip19, getEventHash, Event } from 'nostr-tools';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SignerService } from 'src/app/services/signer.service';
import { NostrService } from 'src/app/services/nostr.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  buttonText = "Generate New Key";
  privateKey: Uint8Array = new Uint8Array();
  publicKey: string = "";
  npub: string = "";
  nsec: string = "";
  generateNewKeyView: boolean = false;
  loginWithPrivateKeyView: boolean = false;
  loginWithExtensionView: boolean = false;
  initialLoginView: boolean = true;

  constructor(
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private router: Router,
    private signerService: SignerService,
    private nostrService: NostrService
  ) {
     if (this.signerService.getPublicKey() !== "") {
      this.openSnackBar("You are already signed in!", "dismiss");
      this.router.navigate(["/feed"]);
    }
  }

  generateNewKey() {
    this.generateNewKeyView = true;
    this.loginWithPrivateKeyView = false;
    this.loginWithExtensionView = false;
    this.initialLoginView = false;
    this.setKeys();
  }

  loginWithPrivateKey() {
    this.npub = "";
    this.nsec = "";
    this.generateNewKeyView = false;
    this.loginWithPrivateKeyView = true;
    this.loginWithExtensionView = false;
    this.initialLoginView = false;
  }

  loginWithExtension() {
    this.npub = "";
    this.nsec = "";
    this.generateNewKeyView = false;
    this.loginWithPrivateKeyView = false;
    this.loginWithExtensionView = true;
    this.initialLoginView = false;
  }

  home() {
    this.generateNewKeyView = false;
    this.loginWithPrivateKeyView = false;
    this.loginWithExtensionView = false;
    this.initialLoginView = true;
  }

  async goToApp() {
    this.openSnackBar("Loading! Please wait a moment", "dismiss");
    this.signerService.clearKeys();
    let success: boolean = false;

    if (this.generateNewKeyView) {
      success = this.signerService.handleLoginWithNsec(this.nsec);
    } else if (this.loginWithPrivateKeyView && this.nsec !== "") {
      success = this.signerService.handleLoginWithNsec(this.nsec);
    } else {
      success = await this.handleLoginWithExtension();
    }

    if (success) {
      await this.getContactList(this.signerService.getPublicKey());
      await this.getMuteList(this.signerService.getPublicKey());
      this.openSnackBar("Successfully Signed In", "dismiss");
      this.router.navigate(['/feed']);
    } else {
      this.openSnackBar("Failed Signed In", "dismiss");
      this.signerService.clearKeys();
      this.router.navigate(['/login']);
    }
  }

  async handleLoginWithExtension(): Promise<boolean> {
    if (this.signerService.usingNostrBrowserExtension()) {
      return this.signerService.handleLoginWithExtension();
    } else {
      this.openSnackBar("No Nostr Browser extension", "dismiss");
      return false;
    }
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {duration: 1300});
  }

  copynsec() {
    this.clipboard.copy(this.nsec);
    this.openSnackBar("nsec copied!", "dismiss");
  }

  copynpub() {
    this.clipboard.copy(this.npub);
    this.openSnackBar("npub copied!", "dismiss");
  }

  setKeys() {
    this.signerService.clearKeys();
    this.setPrivateKey();
    this.setPublicKey();
    this.setNpub();
    this.setNsec();
  }

  setPrivateKey() {
    this.privateKey = generateSecretKey(); // تغییر به generateSecretKey
  }

  setPublicKey() {
    this.publicKey = getPublicKey(this.privateKey);
  }

  setNpub() {
    this.npub = nip19.npubEncode(this.publicKey);
  }

  setNsec() {
    this.nsec = nip19.nsecEncode(this.privateKey);
  }

  async getContactList(pubkey: string) {
    await this.nostrService.getContactList(pubkey);
  }

  async getMuteList(pubkey: string) {
    await this.nostrService.getMuteList(pubkey);
  }
}
