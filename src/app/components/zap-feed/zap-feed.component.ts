import { Component, OnInit, OnDestroy } from '@angular/core';
import { Post, Zap } from '../../types/post';
import { Filter, Event } from 'nostr-tools';
import { NostrService } from 'src/app/services/nostr.service';
import { SimplePool } from 'nostr-tools';

@Component({
  selector: 'app-zap-feed',
  templateUrl: './zap-feed.component.html',
  styleUrls: ['./zap-feed.component.css']
})
export class ZapFeedComponent implements OnInit, OnDestroy {
    zaps: Zap[] = [];
    subscription: any = null; // Updated to match the new approach
    loading: boolean = true;
    private pool: SimplePool;

    constructor(private nostrService: NostrService) {
      this.pool = new SimplePool(); // Create a pool to manage subscriptions
    }

    ngOnInit() {
        this.getZaps();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsub(); // Unsubscribe if active
        }
    }

    async getZaps() {
        const filter = this.getFilter();
        this.zaps = await this.nostrService.getZaps(filter);
        this.loading = false;
        console.log("GETTING ZAPS");
        console.log(this.zaps);
        this.listenForZaps(); // Start listening for new zaps
    }

    getFilter(): Filter {
        return {
            kinds: [9735],
            limit: 50
        };
    }

    async listenForZaps() {
        const relayUrls = this.nostrService.relays(); // Get relay URLs
        const filter: Filter = {
            kinds: [9735],
            since: Math.floor(Date.now() / 1000)
        };

        // Use SimplePool to subscribe to multiple relays
        this.subscription = this.pool.subscribeMany(relayUrls, [filter], {
            onevent: (event: Event) => {
                this.zaps.unshift(new Zap(event.id, event.kind, event.pubkey, event.created_at, event.sig, event.tags));
            },
            oneose: () => {
                console.log('End of subscription events');
            }
        });
    }
}
