export interface ItemInternalAttrs {

    height: string;

    dynamicHeight: string;

    accHeight: string;

    index: string;

    id: string;

    visible: string;

    context: string;

    width?: string;
}

export class ItemChanges<T> {

    all: T[];

    added: T[];

    removed: T[];

    maintained: T[];
}

export class ViewportInfo<T> {

    startIndex: number;

    startItem: T;

    endIndex: number;

    endItem: T;
}

export class ScrollConfig {

    animation?: number | false = 500;

    offsetTop?: number = 0;

    pauseListeners?: boolean = true;

    onComplete?: () => void = () => void (0);
}

export class RefreshConfig<T> {

    changedItems?: RefreshItemsConfig<T>[];

    delay?: number;

    onlyRefreshLayout?: boolean;
}

export class RefreshItemsConfig<T> {

    item: T;

    height?: number;
}

export enum ScrollDirection {

    DOWN = 'DOWN', UP = 'UP'
}

export enum RefreshType {

    PLACEHOLDER = 'PLACEHOLDER', VISIBLE = 'VISIBLE'
}