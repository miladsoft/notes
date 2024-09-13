import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

// External Modules
import { QRCodeModule } from 'angularx-qrcode';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { provideHttpCache, withHttpCacheInterceptor } from '@ngneat/cashew';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

// Material Modules
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@angular/flex-layout';

// Components
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { FeedComponent } from './components/feed/feed.component';
import { PostComponent } from './components/post/post.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LoginComponent } from './components/login/login.component';
import { RelayComponent } from './components/relay/relay.component';
import { CreateEventComponent } from './components/create-event/create-event.component';
import { UsersComponent } from './components/users/users.component';
import { MessengerComponent } from './components/messenger/messenger.component';
import { UserComponent } from './components/user/user.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { Kind1Component } from './components/kind1/kind1.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { SearchComponent } from './components/search/search.component';
import { FollowingComponent } from './components/following/following.component';
import { PostDetailComponent } from './components/post-detail/post-detail.component';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { FollowComponent } from './components/follow/follow.component';
import { LoadingComponent } from './components/loading/loading.component';
import { HashtagFeedComponent } from './components/hashtag-feed/hashtag-feed.component';
import { ZapComponent } from './components/zap/zap.component';
import { ImageDialogComponent } from './components/image-dialog/image-dialog.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ListedUserComponent } from './components/listed-user/listed-user.component';
import { TrendingComponent } from './components/trending/trending.component';
import { ZapFeedComponent } from './components/zap-feed/zap-feed.component';
import { HomeFeedComponent } from './components/home-feed/home-feed.component';
import { UserBottomSheetComponent } from './components/user-bottom-sheet/user-bottom-sheet.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { PaymentRequestComponent } from './components/payment-request/payment-request.component';
import { SendPaymentComponent } from './components/send-payment/send-payment.component';
import { PostQuickComponent } from './components/post-quick/post-quick.component';
 import { MessagesListComponent } from './components/messages-list/messages-list.component';
import { PayInvoiceComponent } from './components/pay-invoice/pay-invoice.component';

// Pipes
import { UsernamePipe } from './pipes/username.pipe';
import { NpubPipe } from './pipes/npub.pipe';
import { HashtagPipe } from './pipes/hashtag.pipe';
import { SafePipe } from './pipes/safe.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
import { NeventPipe } from './pipes/nevent.pipe';
import { EllipsisPipe } from './pipes/ellipsis.pipe';
import { HumantimePipe } from './pipes/humantime.pipe';
import { KeyboardPipe } from './pipes/keyboard.pipe';

// IndexedDB
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';

// WebLN and Nostr types
import { WebLNProvider } from '@webbtc/webln-types';
import { NostrWindow } from './types/nostr';

// Routing
import { AppRoutingModule } from './app-routing.module';
import { HashtagQuickComponent } from './compontents/hashtag-quick/hashtag-quick.component';

// Database configuration
const dbConfig: DBConfig = {
  name: 'notesdb',
  version: 3,
  objectStoresMeta: [
    {
      store: 'users',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'name', keypath: 'name', options: { unique: false } },
        { name: 'username', keypath: 'username', options: { unique: false } },
        { name: 'displayName', keypath: 'displayName', options: { unique: false } },
        { name: 'website', keypath: 'website', options: { unique: false } },
        { name: 'about', keypath: 'about', options: { unique: false } },
        { name: 'picture', keypath: 'picture', options: { unique: false } },
        { name: 'banner', keypath: 'banner', options: { unique: false } },
        { name: 'lud06', keypath: 'lud06', options: { unique: false } },
        { name: 'lud16', keypath: 'lud16', options: { unique: false } },
        { name: 'nip05', keypath: 'nip05', options: { unique: false } },
        { name: 'pubkey', keypath: 'pubkey', options: { unique: true } },
        { name: 'npub', keypath: 'npub', options: { unique: true } },
        { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
        { name: 'apiKey', keypath: 'apiKey', options: { unique: false } },
        { name: 'following', keypath: 'following', options: { unique: false } }
      ]
    },
    {
      store: 'notifications',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'kind', keypath: 'kind', options: { unique: false } },
        { name: 'walletPubkey', keypath: 'walletPubkey', options: { unique: false } },
        { name: 'walletNpub', keypath: 'walletNpub', options: { unique: false } },
        { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
        { name: 'username', keypath: 'username', options: { unique: false } },
        { name: 'picture', keypath: 'picture', options: { unique: false } },
        { name: 'receiverPubKey', keypath: 'receiverPubKey', options: { unique: false } },
        { name: 'receiverNpub', keypath: 'receiverNpub', options: { unique: false } },
        { name: 'receiverEventId', keypath: 'receiverEventId', options: { unique: false } },
        { name: 'senderPubkey', keypath: 'senderPubkey', options: { unique: false } },
        { name: 'senderNpub', keypath: 'senderNpub', options: { unique: false } },
        { name: 'senderMessage', keypath: 'senderMessage', options: { unique: false } },
        { name: 'bolt11', keypath: 'bolt11', options: { unique: false } },
        { name: 'preImage', keypath: 'preImage', options: { unique: false } },
        { name: 'description', keypath: 'description', options: { unique: false } },
        { name: 'fromNow', keypath: 'fromNow', options: { unique: false } },
        { name: 'content', keypath: 'content', options: { unique: false } },
        { name: 'satAmount', keypath: 'satAmount', options: { unique: false } }
      ]
    }
  ],
  migrationFactory() {
    return {
      1: (db, transaction) => {
        const store = transaction.objectStore('users');
        store.createIndex('users', 'users', { unique: false });
      },
      3: (db, transaction) => {
        const store = transaction.objectStore('notifications');
        store.createIndex('notifications', 'notifications', { unique: false });
      }
    };
  }
};

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    FeedComponent,
    PostComponent,
    SettingsComponent,
    LoginComponent,
    RelayComponent,
    CreateEventComponent,
    UsersComponent,
    MessengerComponent,
    UserComponent,
    UserDetailComponent,
    Kind1Component,
    ProfileEditComponent,
    SearchComponent,
    FollowingComponent,
    PostDetailComponent,
    ContactListComponent,
    FollowComponent,
    LoadingComponent,
    HashtagFeedComponent,
    ZapComponent,
    ImageDialogComponent,
    NotificationsComponent,
    NotificationComponent,
    ListedUserComponent,
    TrendingComponent,
    ZapFeedComponent,
    HomeFeedComponent,
    UserBottomSheetComponent,
    WalletComponent,
    PaymentRequestComponent,
    SendPaymentComponent,
    PostQuickComponent,
    HashtagQuickComponent,
    MessagesListComponent,
    PayInvoiceComponent,
    UsernamePipe,
    NpubPipe,
    HashtagPipe,
    SafePipe,
    TruncatePipe,
    NeventPipe,
    EllipsisPipe,
    HumantimePipe,
    KeyboardPipe
  ],
  imports: [

    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    QRCodeModule,
    InfiniteScrollModule,
    ZXingScannerModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatTabsModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatGridListModule,
    MatChipsModule,
    FlexLayoutModule,
    MatBottomSheetModule,
    MatSnackBarModule,
    AppRoutingModule,
    NgxIndexedDBModule.forRoot(dbConfig)
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    provideHttpClient(withInterceptorsFromDi()), // Interceptors
    provideHttpCache()

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

declare global {
  interface Window {
    webln?: WebLNProvider;
    nostr?: NostrWindow;
  }
}
