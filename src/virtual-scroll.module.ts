import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualScrollComponent } from './virtual-scroll.component';
import { ItemObserverDirective } from './item-observer.directive';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        VirtualScrollComponent,
        ItemObserverDirective
    ],
    exports: [
        VirtualScrollComponent
    ]
})
export class VirtualScrollModule {
}