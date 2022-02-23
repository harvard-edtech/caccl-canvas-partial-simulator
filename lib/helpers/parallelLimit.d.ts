/**
 * Run functions in parallel
 * @author Gabe Abrams
 */
declare const parallelLimit: (tasks: (() => Promise<unknown>)[], limit: number) => Promise<any[]>;
export default parallelLimit;
