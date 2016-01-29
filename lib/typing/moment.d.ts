declare module moment {
    export interface Moment {
        /**
         * @since 2.10.7+
         */
        isSameOrAfter:(b:MomentComparable, granularity?:string) => boolean;
    }
}
