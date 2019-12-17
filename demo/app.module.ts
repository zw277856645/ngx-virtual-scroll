import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRouterModule } from './app-router.module';
import { AppComponent } from './app.component';
import { DemoCommonComponent } from './app/demo-common.component';
import { DemoDynamicComponent } from './app/demo-dynamic.component';
import { JwBootstrapSwitchNg2Module } from 'jw-bootstrap-switch-ng2';
import { VirtualScrollModule } from '../src/virtual-scroll.module';

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        AppRouterModule,
        JwBootstrapSwitchNg2Module,
        VirtualScrollModule
    ],
    declarations: [
        AppComponent,
        DemoCommonComponent,
        DemoDynamicComponent
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule {
}