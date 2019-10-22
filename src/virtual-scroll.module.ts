import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualScrollComponent } from './virtual-scroll.component';
import { VisibleObserverDirective } from './visible-observer.directive';
import { PlaceholderObserverDirective } from './placeholder-observer.directive';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        VirtualScrollComponent,
        VisibleObserverDirective,
        PlaceholderObserverDirective
    ],
    exports: [
        VirtualScrollComponent
    ]
})
export class VirtualScrollModule {
}