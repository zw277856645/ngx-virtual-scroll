/**
 * @ignore
 */
export enum ScrollDirection {

    DOWN = 'DOWN', UP = 'UP'
}

/**
 * @ignore
 */
export enum RefreshType {

    PLACEHOLDER = 'PLACEHOLDER', VISIBLE = 'VISIBLE'
}

/**
 * @ignore
 */
export class ViewportInfo<T> {

    startIndex: number;

    startItem: T;

    endIndex: number;

    endItem: T;
}

/**
 * @ignore
 */
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

/**
 * 「真实条目」或「占位符条目」变化数据结构
 */
export class ItemChanges<T> {

    /**
     * 当前所有需要渲染的条目
     */
    all: T[];

    /**
     * 与上一次相比，新增的条目
     */
    added: T[];

    /**
     * 与上一次相比，减少的条目
     */
    removed: T[];

    /**
     * 与上一次相比，不变的条目
     */
    maintained: T[];
}

/**
 * 滚动行为配置
 */
export class ScrollConfig {

    /**
     * 动画时长
     */
    animation?: number | false = 500;

    /**
     * 滚动位置距离滚动容器顶部偏移量
     *
     * - 默认将条目滚动到与容器顶部平齐的位置，若容器内含有固定定位(position:fixed)的元素(如 header)时，会挡住条目，
     * 此时可设置 offsetTop 变化对齐位置
     */
    offsetTop?: number = 0;

    /**
     * 是否暂停滚动监听器
     *
     * - 忽略从当前位置到需要定位位置之间的滚动事件处理，可快速刷新最新位置数据
     */
    pauseListeners?: boolean = true;

    /**
     * 滚动结束的回调
     */
    onComplete?: () => void = () => void (0);
}

/**
 * 刷新行为配置
 */
export class RefreshConfig<T> {

    /**
     * 发生了插件无法获知的高度变化的条目
     */
    changedItems?: RefreshItemsConfig<T>[];

    /**
     * 刷新延时
     */
    delay?: number;

    /**
     * 是否只刷新布局，不刷新`真实条目`和`占位符条目`
     */
    onlyRefreshLayout?: boolean;
}

/**
 * 条目高度变化信息
 */
export class RefreshItemsConfig<T> {

    /**
     * 布局变化的条目
     */
    item: T;

    /**
     * 变化后的高度，不提供该值则读取原生高度，提供该值可加快刷新
     */
    height?: number;
}

