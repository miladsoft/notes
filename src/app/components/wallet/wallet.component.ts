import { Component, OnInit } from '@angular/core';
import { webln } from "@getalby/sdk";
import { SignerService } from 'src/app/services/signer.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { PaymentRequestComponent } from '../payment-request/payment-request.component';
import { SendPaymentComponent } from '../send-payment/send-payment.component';
import { BarcodeFormat } from '@zxing/library';
import { PayInvoiceComponent } from '../pay-invoice/pay-invoice.component';
import { decode } from '@gandlaf21/bolt11-decode';

interface Balance {
    balance: number;
    currency: string;
}

interface PaymentRequest {
    paymentRequest: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
    nwc: any;
    balance: Balance;
    loading: boolean = true;
    currentInput: string = "";
    paymentRequest: PaymentRequest;
    username: string;
    allowedFormats = [ BarcodeFormat.QR_CODE ]
    scanQR: boolean = false;
    qrResultString: string = "";
    qrCodeScannerButton: string = "qr_code_scanner";
    error: string = "";

    constructor(
        private signerService: SignerService,
        private _bottomSheet: MatBottomSheet
    ) {
        const nwcURI = this.signerService.getNostrWalletConnectURI()
        this.nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI });



        const secretKey = this.signerService.getPrivateKey(); // Make sure secret key is retrieved
        if (secretKey) {
            this.nwc = new webln.NWC({ nostrWalletConnectUrl: nwcURI, secret: secretKey }); // Pass the secret key
        } else {
            console.error("Missing secret key for NWC.");
            // Handle the case where the secret key is missing
        }

    }

    ngOnInit(): void {
        this.username = this.signerService.getUsername(this.signerService.getPublicKey());
        this.setBalance();
    }

    async setBalance(): Promise<void> {
        await this.nwc.enable();
        this.balance = await this.nwc.getBalance();
        this.loading = false;
    }

    changeNumber(value: string) {
        if (value === 'backspace') {
            this.currentInput = this.currentInput.slice(0, -1);
        } else if (this.currentInput.length > 11) {
            return;
        } else if (value === '.' && this.currentInput.includes('.')) {
            return;
        } else {
            this.currentInput = this.currentInput.concat(value);
        }
    }

    async receive(): Promise<void> {
      try {
          // Initialize NWC without passing the private key directly
          const nwc = new webln.NWC({
              nostrWalletConnectUrl: this.signerService.getNostrWalletConnectURI(),
          });

          // Enable NWC (this ensures that the client is properly connected and ready)
          await nwc.enable();

          // Create a Lightning invoice
          const ok = await nwc.makeInvoice({
              amount: Number(this.currentInput), // in sats
              defaultMemo: "notes lightning request",
          });

          console.log(ok);
          this.paymentRequest = ok;
          console.log(this.paymentRequest.paymentRequest);

          // Open the bottom sheet with the payment request
          this._bottomSheet.open(PaymentRequestComponent, {
              data: {
                  paymentRequest: this.paymentRequest.paymentRequest,
                  username: this.username,
              }
          });

      } catch (error) {
          console.error("Error creating invoice: ", error);
          this.error = `Failed to create invoice: ${error.message}`;
      }
  }



    send(){
        this._bottomSheet.open(SendPaymentComponent, {
            data: {
                sats: Number(this.currentInput)
            }
        });
    }

    openQRScanner() {
        if (this.scanQR) {
            this.scanQR = false;
            this.qrCodeScannerButton = "qr_code_scanner";
        } else {
            this.scanQR = true;
            this.qrCodeScannerButton = "close";
        }
    }

    // scanSuccessHandler(event) {
    //     console.log(event);
    // }

    async pasteInvoice() {
        const text = await navigator.clipboard.readText();
        this.qrResultString = text;
        if (this.isValidPaymentInvoice(this.qrResultString)) {
            this._bottomSheet.open(PayInvoiceComponent, {
                data: {
                    invoice: this.qrResultString
                }
            });
        } else {
            this.error = `Unable to decode invoice: ${this.qrResultString}`;
        }
    }

    scanSuccessHandler(resultString: string) {
        this.qrResultString = resultString;
        if (this.isValidPaymentInvoice(this.qrResultString)) {
            this._bottomSheet.open(PayInvoiceComponent, {
                data: {
                    invoice: this.qrResultString
                }
            });
        } else {
            this.error = `Unable to decode invoice: ${this.qrResultString}`;
        }
    }

    isValidPaymentInvoice(value: string) {
        try {
            const decodedInvoice = decode(value);
            for (let s of decodedInvoice.sections) {
                if (s.name === "amount") {
                    String(Number(s.value)/1000);
                    break;
                }
            }
        } catch {
            return false;
        }
        return true;
    }

    // scanErrorHandler($event) {
    //     console.log($event);
    // }

    // scanFailureHandler($event) {
    //     console.log($event);
    // }
}
