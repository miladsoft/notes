import { Component, Input, OnInit } from '@angular/core';
import { SignerService } from 'src/app/services/signer.service';
import { User } from '../../types/user';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LightningService } from 'src/app/services/lightning.service';
import { LightningResponse, LightningInvoice } from 'src/app/types/post';
import { bech32 } from '@scure/base';
import { decode } from '@gandlaf21/bolt11-decode';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { webln } from '@getalby/sdk';
import { NostrService } from 'src/app/services/nostr.service';
import { finalizeEvent, getEventHash, UnsignedEvent, Event } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  @Input() canEnlarge = false;
  @Input() user?: User;
  @Input() nip05Verified?: boolean;
  canEdit: boolean = false;
  nsec: string = '';
  displaynsec: boolean = false;
  nsecButton: string = 'key';
  isMyProfile: boolean = false;
  showZapForm: boolean = false;
  lightningResponse: LightningResponse | null = null;
  lightningInvoice: LightningInvoice | null = null;
  sats: string;
  paymentInvoice: string = '';
  invoiceAmount: string = '?';
  displayQRCode: boolean = false;
  showInvoiceSection: boolean = false;
  displayUserQR: boolean = false;
  userQRLink: string = '';
  followList: string[];
  following: boolean;
  followerCount: number = 0;
  followingCount: number = 0;

  constructor(
    private signerService: SignerService,
    private nostrService: NostrService,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private lightning: LightningService,
    private dialog: MatDialog
  ) {
    this.followList = this.signerService.getFollowingList();
    this.sats = this.signerService.getDefaultZap();
  }

  ngOnInit() {
    let pubkey = this.signerService.getPublicKey();
    if (this.user) {
      this.following = this.followList.includes(this.user.pubkey);
      if (pubkey === this.user.pubkey) {
        this.canEdit = true;
        this.isMyProfile = true;
      }
      this.nsec = this.signerService.nsec();
      this.userQRLink = `https://notes.seniorblockchain.io/#/users/${this.user.npub}`;
      this.getFollowerCount();
      this.getFollowingCount();
    }
  }

  async zap() {
    this.showZapForm = !this.showZapForm;
    if (this.showZapForm && this.user && (this.user.lud06 || this.user.lud16)) {
      this.getLightningInfo();
    } else {
      this.openSnackBar("user can't receive zaps", 'dismiss');
    }
  }

  copyLink() {
    if (this.user) {
      const url = `https://notes.seniorblockchain.io/#/users/${this.user.npub}`;
      this.clipboard.copy(url);
      this.openSnackBar('Link to profile copied', 'dismiss');
    }
  }

  async setFollowingListAsYours() {
    if (this.user) {
      try {
        const contactList = await this.nostrService.getContactListEvent(this.user.pubkey);
        this.signerService.setFollowingListFromTags(contactList.tags);
        await this.publishFollowingList(this.user);
        this.openSnackBar('Following list set as yours', 'dismiss');
      } catch (error) {
        console.error('Failed to set following list:', error);
        this.openSnackBar('Failed to set following list', 'dismiss');
      }
    }
  }

  copynsec() {
    if (this.nsec) {
      this.clipboard.copy(this.nsec);
      this.openSnackBar("nsec copied. Keep it private!", "dismiss");
    } else {
      this.openSnackBar("No nsec available to copy", "dismiss");
    }
  }

  copyInvoice() {
    if (this.paymentInvoice) {
      this.clipboard.copy(this.paymentInvoice);
      this.openSnackBar("Invoice copied", "dismiss");
    } else {
      this.openSnackBar("No invoice available to copy", "dismiss");
    }
  }

  showQRCode() {
    this.displayQRCode = !this.displayQRCode;
  }


  async getFollowerCount() {
    this.followerCount = await this.nostrService.getFollowerCount(this.user.pubkey);
  }

  async getFollowingCount() {
    this.followingCount = await this.nostrService.getFollowerCount(this.user.pubkey);
  }

  sendZap() {
    this.getLightningInvoice(String(Number(this.sats) * 1000));
  }

  setInvoiceAmount(invoice: string) {
    if (invoice) {
      const decodedInvoice = decode(invoice);
      const amountSection = decodedInvoice.sections.find((s) => s.name === 'amount');
      if (amountSection) {
        this.invoiceAmount = String(Number(amountSection.value) / 1000);
      }
    }
  }

  getLightningInfo() {
    let lightningAddress = '';
    if (this.user?.lud06) {
      const { words } = bech32.decode(this.user.lud06, 5000);
      const data = new Uint8Array(bech32.fromWords(words));
      lightningAddress = new TextDecoder().decode(Uint8Array.from(data));
    } else if (this.user?.lud16?.toLowerCase().startsWith('lnurl')) {
      const { words } = bech32.decode(this.user.lud16, 5000);
      const data = new Uint8Array(bech32.fromWords(words));
      lightningAddress = new TextDecoder().decode(Uint8Array.from(data));
    } else if (this.user?.lud16) {
      lightningAddress = this.lightning.getLightningAddress(this.user.lud16);
    }

    if (lightningAddress !== '') {
      this.lightning.getLightning(lightningAddress).subscribe((response) => {
        this.lightningResponse = response;
        if (this.lightningResponse.status === 'Failed') {
          this.showZapForm = false;
          this.openSnackBar('Failed to lookup lightning address', 'dismiss');
        } else if (this.lightningResponse.callback) {
          this.showZapForm = true;
          this.displayUserQR = false;
        } else {
          this.showZapForm = false;
          this.openSnackBar("couldn't find user's lightning address", 'dismiss');
        }
      });
    } else {
      this.openSnackBar('No lightning address found', 'dismiss');
    }
  }

  async publishFollowingList(user: User) {
    const tags: string[][] = this.signerService.getFollowingListAsTags();
    tags.push(['p', user.pubkey, 'wss://relay.damus.io/', user.username]);

    const unsignedEvent = this.nostrService.getUnsignedEvent(3, tags, '');
    const privateKey = this.signerService.getPrivateKey();

    let signedEvent: Event;
    if (privateKey !== '') {
      const privateKeyBytes = hexToBytes(privateKey);
      signedEvent = finalizeEvent(unsignedEvent, privateKeyBytes);
    } else {
      signedEvent = await this.signerService.signEventWithExtension(unsignedEvent);
    }

    this.nostrService.publishEventToPool(signedEvent);
  }

  enlargeUserPicture() {
    if (this.canEnlarge) {
      this.dialog.open(ImageDialogComponent, { data: { picture: this.user.picture } });
    }
  }

  async getLightningInvoice(amount: string) {
    if (this.lightningResponse && this.lightningResponse.callback) {
      this.lightning.getLightningInvoice(this.lightningResponse.callback, amount)
        .subscribe(response => {
          this.lightningInvoice = response;
          this.paymentInvoice = this.lightningInvoice.pr;
          this.setInvoiceAmount(this.paymentInvoice);
          this.showZapForm = false;
          this.showInvoiceSection = true;
          this.payInvoice();
        });
    }
  }

  async payInvoice() {
    let paid = false;
    const nwcURI = this.signerService.getNostrWalletConnectURI()
    console.log(nwcURI);
    if (nwcURI === null) {
      paid = await this.lightning.payInvoice(this.paymentInvoice);
    } else {
      paid = await this.zapWithNWC(nwcURI, this.paymentInvoice);
    }
    if (paid) {
      this.openSnackBar("Zapped!", "dismiss");
      this.hideInvoice();
    }
  }
  hideInvoice() {
    this.showInvoiceSection = false;
  }
  async zapWithNWC(nwcURI: string, invoice: string): Promise<boolean> {
    this.openSnackBar("Zapping with Nostr Wallet Connect..", "dismiss");
    const nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI });
    // connect to the relay
    await nwc.enable();

    // now you can send payments by passing in the invoice
    const response = await nwc.sendPayment(invoice);
    console.log(response);
    // disconnect from the relay
    nwc.close()
    return true;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, { duration: 1300 });
  }

  copynpub() {
    if (this.user) {
      this.clipboard.copy(this.user.npub);
      this.openSnackBar("npub copied!", "dismiss");
    }
  }

  showNsec() {
    if (this.displaynsec) {
      this.displaynsec = false;
      this.nsecButton = "key";
    } else {
      this.displaynsec = true;
      this.nsecButton = "key_off";
    }
  }

  showUserQR() {
    if (this.displayUserQR) {
      this.displayUserQR = false;
    } else {
      this.displayUserQR = true;
      this.showZapForm = false;
    }
  }

}
