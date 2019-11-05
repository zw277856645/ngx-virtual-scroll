import { animate, group, style, transition, trigger } from '@angular/animations';

export function resultAnim() {
    return trigger('resultAnim', [
        transition(':enter',
            [
                style({
                    overflow: 'hidden',
                    transform: 'scaleY(0)',
                    'transform-origin': 'top center',
                    height: 0
                }),

                animate('300ms 0ms linear', style({
                    height: '*',
                    transform: 'scaleY(1)'
                }))
            ]
        ),

        transition(':leave', [
            style({
                overflow: 'hidden',
                transform: 'scaleY(1)',
                'transform-origin': 'top center',
                opacity: 1
            }),

            group([
                animate('300ms linear', style({
                    height: 0
                })),
                animate('350ms linear', style({
                    transform: 'scaleY(0)',
                    opacity: 0
                }))
            ])
        ])
    ]);
}